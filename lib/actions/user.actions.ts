'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import User from '@/lib/database/models/user.model'
import Order from '@/lib/database/models/order.model'
import Event from '@/lib/database/models/event.model'
import { handleError } from '@/lib/utils'

import { CreateUserParams, UpdateUserParams } from '@/types'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function createUser(user: CreateUserParams) {
  try {
    await connectToDatabase()

    const newUser = await User.create(user)
    return JSON.parse(JSON.stringify(newUser))
  } catch (error) {
    handleError(error)
  }
}

export async function getUserById(userId: string) {
  try {
    await connectToDatabase()

    const user = await User.findById(userId)

    if (!user) throw new Error('User not found')
    return JSON.parse(JSON.stringify(user))
  } catch (error) {
    handleError(error)
  }
}

export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase()

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, { new: true })

    if (!updatedUser) throw new Error('User update failed')
    return JSON.parse(JSON.stringify(updatedUser))
  } catch (error) {
    handleError(error)
  }
}

export async function deleteUser(clerkId: string) {
  try {
    await connectToDatabase()

    // Find user to delete
    const userToDelete = await User.findOne({ clerkId })

    if (!userToDelete) {
      throw new Error('User not found')
    }

    // Unlink relationships
    await Promise.all([
      // Update the 'events' collection to remove references to the user
      Event.updateMany(
        { _id: { $in: userToDelete.events } },
        { $pull: { organizer: userToDelete._id } }
      ),

      // Update the 'orders' collection to remove references to the user
      Order.updateMany({ _id: { $in: userToDelete.orders } }, { $unset: { buyer: 1 } }),
    ])

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userToDelete._id)
    revalidatePath('/')

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null
  } catch (error) {
    handleError(error)
  }
}

// Fallback: if Clerk user exists but MongoDB record is missing (webhook failed),
// create the record on the fly and update Clerk publicMetadata.
export async function ensureUser(): Promise<string | null> {
  try {
    const { userId: clerkId, sessionClaims } = await auth();
    if (!clerkId) return null;

    // Already has a MongoDB userId in session
    const existingUserId = sessionClaims?.userId as string | undefined;
    if (existingUserId) return existingUserId;

    await connectToDatabase();

    // Check if MongoDB record exists by clerkId
    let dbUser = await User.findOne({ clerkId });

    if (!dbUser) {
      // Fetch user info from Clerk
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);

      dbUser = await User.create({
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        username: clerkUser.username ?? clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        photo: clerkUser.imageUrl,
      });
    }

    // Update Clerk publicMetadata so future requests have userId
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: { userId: dbUser._id.toString() },
    });

    return dbUser._id.toString();
  } catch (error) {
    console.error('[ensureUser] Failed:', error);
    return null;
  }
}