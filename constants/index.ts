export const headerLinks = [
    {
      label: 'nav.home',
      route: '/',
    },
    {
      label: 'nav.create',
      route: '/events/create',
      children: [
        { label: 'nav.createSample', route: '/events/create' },
        { label: 'nav.createOcCard', route: '/oc-cards/create' },
      ],
    },
    {
      label: 'nav.profile',
      route: '/profile',
    },
    {
      label: 'nav.festivals',
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