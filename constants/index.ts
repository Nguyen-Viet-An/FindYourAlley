export const headerLinks = [
    {
      label: 'Trang chủ',
      route: '/',
    },
    {
      label: 'Đăng bài',
      route: '/events/create',
      children: [
        { label: 'Đăng sample', route: '/events/create' },
        { label: 'Đăng OC card', route: '/oc-cards/create' },
      ],
    },
    {
      label: 'Profile',
      route: '/profile',
    },
    {
      label: 'Festivals',
      route: '/festivals',
      adminOnly: true,
    },
  ]

  export const ocCardDefaultValues = {
    ownerName: '',
    images: [{ ocName: '', artistName: '', imageUrl: '', description: '' }],
    festival: [] as string[],
    eventTime: '',
    location: '',
    appearanceText: '',
    appearanceImageUrl: '',
    contactMethod: '',
  }

  export const eventDefaultValues = {
    title: '',
    description: '',
    artists: [{ name: '', link: '' }],
    images: [{ imageUrl: '', categoryIds: [], itemTypeIds: [] }],
    startDateTime: new Date(),
    endDateTime: new Date(),
    // categoryId: '',
    hasPreorder: "No",
    price: '',
    url: '',
    festival: [] as string[],
    featuredProductImageUrl: '',
    featuredProductDescription: '',
    dealBadge: '',
    dealDescription: '',
    attendDays: [] as number[],
  }