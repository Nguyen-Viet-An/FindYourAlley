export const headerLinks = [
    {
      label: 'Trang chủ',
      route: '/',
    },
    {
      label: 'Đăng sample',
      route: '/events/create',
    },
    {
      label: 'Profile',
      route: '/profile',
    },
  ]
  
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
  }