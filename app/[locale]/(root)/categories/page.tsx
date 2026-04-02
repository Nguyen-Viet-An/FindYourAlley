import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getAllCategoriesAdmin } from '@/lib/actions/category.actions';
import CategoryManager from './CategoryManager';

const ADMIN_USER_ID = '67db65cdd14104a0c014576d';

export default async function CategoriesPage() {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;
  if (userId !== ADMIN_USER_ID) redirect('/');

  const categories = await getAllCategoriesAdmin(userId);

  return (
    <div className="wrapper my-8">
      <CategoryManager initialCategories={categories || []} userId={userId} />
    </div>
  );
}