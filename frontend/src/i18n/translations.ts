// Complete English and Arabic translations for the entire application

export type Language = 'en' | 'ar';

export interface Translations {
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    update: string;
    search: string;
    filter: string;
    clear: string;
    submit: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    confirm: string;
    yes: string;
    no: string;
    actions: string;
    status: string;
    date: string;
    time: string;
    total: string;
    subtotal: string;
    discount: string;
    tax: string;
    price: string;
    quantity: string;
    amount: string;
    description: string;
    notes: string;
    active: string;
    inactive: string;
    all: string;
    view: string;
    download: string;
    upload: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    inventoryPro: string;
  };

  // Navigation
  nav: {
    dashboard: string;
    products: string;
    categories: string;
    suppliers: string;
    customers: string;
    inventory: string;
    stockAdjustments: string;
    purchaseOrders: string;
    goodsReceipt: string;
    stockMovements: string;
    sales: string;
    pos: string;
    salesOrders: string;
    invoices: string;
    payments: string;
    users: string;
    auditLogs: string;
    settings: string;
    logout: string;
    profile: string;
    changePassword: string;
    sessions: string;
    ocrScanner: string;
  };

  // Auth
  auth: {
    login: string;
    logout: string;
    username: string;
    password: string;
    email: string;
    rememberMe: string;
    forgotPassword: string;
    signIn: string;
    signUp: string;
    register: string;
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
    passwordStrength: string;
    weak: string;
    medium: string;
    strong: string;
    veryStrong: string;
    owner: string;
    admin: string;
    cashier: string;
    inventoryManager: string;
    guest: string;
  };

  // Dashboard
  dashboard: {
    welcome: string;
    statistics: string;
    recentActivity: string;
    quickActions: string;
    totalUsers: string;
    totalProducts: string;
    totalCustomers: string;
    totalSales: string;
    lowStock: string;
    pendingOrders: string;
    todayRevenue: string;
    thisMonth: string;
    thisWeek: string;
    today: string;
    systemToday: string;
    userManagement: string;
  };

  // Receipt
  receipt: {
    title: string;
    print: string;
    email: string;
    reprint: string;
    emailTo: string;
    send: string;
  };

  // Analytics
  analytics: {
    title: string;
    salesOverview: string;
    trends: string;
    topProducts: string;
    cashierPerformance: string;
    paymentMethods: string;
    dateRange: string;
    from: string;
    to: string;
    generate: string;
    export: string;
    totalTransactions: string;
    averageTransaction: string;
    uniqueCustomers: string;
    bestDay: string;
    worstDay: string;
    hourlySales: string;
    summary: string;
  };

  // Reports
  reports: {
    title: string;
    zReport: string;
    xReport: string;
    topItems: string;
    salesByHour: string;
    discountLeakage: string;
    generateReport: string;
    reportType: string;
    sessionId: string;
    reportResults: string;
    printReport: string;
    exportJson: string;
  };

  // Settings
  printSettingsConfig: {
    printSettings: string;
    businessInformation: string;
    receiptContent: string;
    printOptions: string;
    paperSettings: string;
    businessName: string;
    businessPhone: string;
    businessEmail: string;
    businessAddress: string;
    taxId: string;
    headerText: string;
    footerText: string;
    returnPolicy: string;
    printQrCode: string;
    printBarcode: string;
    showTaxBreakdown: string;
    showCashierName: string;
    showCustomerInfo: string;
    paperWidth: string;
    fontSize: string;
    reset: string;
  };

  // Products
  products: {
    products: string;
    product: string;
    addProduct: string;
    editProduct: string;
    deleteProduct: string;
    productDetails: string;
    sku: string;
    barcode: string;
    name: string;
    category: string;
    brand: string;
    price: string;
    cost: string;
    stock: string;
    reorderLevel: string;
    reorderQuantity: string;
    maxStockLevel: string;
    location: string;
    unit: string;
    uom: string;
    image: string;
    images: string;
    inStock: string;
    outOfStock: string;
    lowStock: string;
    archived: string;
    restore: string;
    archive: string;
    browseProducts: string;
    manageInventory: string;
  };

  // Categories
  categories: {
    categories: string;
    category: string;
    addCategory: string;
    editCategory: string;
    deleteCategory: string;
    parentCategory: string;
    subcategories: string;
    productCount: string;
    sortOrder: string;
  };

  // Suppliers
  suppliers: {
    suppliers: string;
    supplier: string;
    addSupplier: string;
    editSupplier: string;
    supplierDetails: string;
    contactPerson: string;
    phone: string;
    address: string;
    taxId: string;
    paymentTerms: string;
  };

  // Customers
  customers: {
    customers: string;
    customer: string;
    addCustomer: string;
    editCustomer: string;
    customerDetails: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    companyName: string;
    taxId: string;
    creditLimit: string;
    paymentTerms: string;
    discountPercentage: string;
    vip: string;
    customerNumber: string;
    purchaseHistory: string;
  };

  // Inventory
  inventory: {
    inventory: string;
    stockQuantity: string;
    stockLevel: string;
    stockMovement: string;
    stockMovements: string;
    stockAdjustment: string;
    stockAdjustments: string;
    adjustStock: string;
    currentStock: string;
    newQuantity: string;
    difference: string;
    reason: string;
    damage: string;
    theft: string;
    countError: string;
    expired: string;
    lost: string;
    other: string;
    pending: string;
    approved: string;
    rejected: string;
    approve: string;
    reject: string;
    managePurchaseOrders: string;
    createPurchaseOrder: string;
    completeReceipt: string;
    auditTrail: string;
  };

  // Purchase Orders
  purchaseOrders: {
    purchaseOrders: string;
    purchaseOrder: string;
    createPO: string;
    poNumber: string;
    supplier: string;
    status: string;
    totalAmount: string;
    expectedDate: string;
    items: string;
    unitPrice: string;
    lineTotal: string;
    draft: string;
    submitted: string;
    approved: string;
    received: string;
    cancelled: string;
    approvePO: string;
  };

  // Goods Receipt
  goodsReceipt: {
    goodsReceipt: string;
    createGRN: string;
    grnNumber: string;
    receivedQuantity: string;
    damagedQuantity: string;
    receiveGoods: string;
    complete: string;
    partial: string;
    withDiscrepancy: string;
  };

  // Sales
  sales: {
    sales: string;
    salesOrder: string;
    salesOrders: string;
    createOrder: string;
    orderNumber: string;
    orderDate: string;
    requiredDate: string;
    shippedDate: string;
    deliveredDate: string;
    shippingAddress: string;
    orderStatus: string;
    draft: string;
    confirmed: string;
    processing: string;
    shipped: string;
    delivered: string;
    cancelled: string;
    returned: string;
  };

  // Invoices
  invoices: {
    invoices: string;
    invoice: string;
    createInvoice: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    paidDate: string;
    invoiceStatus: string;
    draft: string;
    sent: string;
    paid: string;
    overdue: string;
    cancelled: string;
    refunded: string;
    subtotal: string;
    taxAmount: string;
    discountAmount: string;
    totalAmount: string;
    paidAmount: string;
    balanceAmount: string;
    terms: string;
  };

  // Payments
  payments: {
    payments: string;
    payment: string;
    processPayment: string;
    paymentNumber: string;
    paymentMethod: string;
    paymentDate: string;
    paymentStatus: string;
    cash: string;
    creditCard: string;
    debitCard: string;
    bankTransfer: string;
    check: string;
    storeCredit: string;
    other: string;
    pending: string;
    completed: string;
    failed: string;
    refunded: string;
    partiallyRefunded: string;
    referenceNumber: string;
    amountTendered: string;
    change: string;
  };

  // OCR
  ocr: {
    ocrScanner: string;
    uploadDocument: string;
    documentType: string;
    receipt: string;
    invoice: string;
    purchaseOrder: string;
    priceList: string;
    referenceNumber: string;
    uploadAndProcess: string;
    processing: string;
    extractedProducts: string;
    reviewProducts: string;
    confidence: string;
    selectAll: string;
    deselectAll: string;
    addToInventory: string;
    bulkAdd: string;
    approve: string;
    correct: string;
    matched: string;
    newProduct: string;
    scanCompleted: string;
    productsFound: string;
  };

  // POS
  pos: {
    pos: string;
    pointOfSale: string;
    session: string;
    startSession: string;
    endSession: string;
    sessionNumber: string;
    cashier: string;
    startingCash: string;
    endingCash: string;
    totalSales: string;
    totalTransactions: string;
    sessionSummary: string;
    cart: string;
    clearCart: string;
    addToCart: string;
    removeFromCart: string;
    customer: string;
    walkInCustomer: string;
    selectCustomer: string;
    selectPaymentMethod: string;
    processSale: string;
    processing: string;
    saleCompleted: string;
    transactionNumber: string;
    change: string;
    receipt: string;
    printReceipt: string;
    startingSession: string;
  };

  // Users
  users: {
    users: string;
    user: string;
    addUser: string;
    editUser: string;
    userDetails: string;
    displayName: string;
    role: string;
    owner: string;
    admin: string;
    cashier: string;
    inventoryManager: string;
    guest: string;
    active: string;
    inactive: string;
    lastLogin: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };

  // Audit
  audit: {
    auditLogs: string;
    auditLog: string;
    action: string;
    actor: string;
    target: string;
    metadata: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
  };

  // Settings
  settings: {
    settings: string;
    generalSettings: string;
    securitySettings: string;
    languageSettings: string;
    language: string;
    english: string;
    arabic: string;
    theme: string;
    notifications: string;
    activeSessions: string;
    revokeSession: string;
    revokeAllSessions: string;
  };

  // Notifications
  notifications: {
    notifications: string;
    unreadNotifications: string;
    markAllRead: string;
    markAsRead: string;
    dismiss: string;
    viewAll: string;
    noNotifications: string;
    allCaughtUp: string;
    stockAlerts: string;
    purchaseOrders: string;
    payments: string;
    systemAlerts: string;
    unread: string;
    all: string;
    settings: string;
    preferences: string;
    channels: string;
    notificationTypes: string;
    quietHours: string;
    dailyDigest: string;
    enableInApp: string;
    enableEmail: string;
    enableSMS: string;
    enablePush: string;
    low: string;
    medium: string;
    high: string;
    critical: string;
  };

  // Licensing & Trials
  licensing?: {
    // Pages
    trialDashboard: string;
    licenseManagement: string;
    activateLicense: string;
    
    // Trial Status
    trialSubtitle: string;
    creditsRemaining: string;
    creditsUsed: string;
    status: string;
    trialStarted: string;
    deviceInfo: string;
    trialGuestId: string;
    deviceFingerprint: string;
    recentActivity: string;
    
    // Status Messages
    noTrial: string;
    startTrialPrompt: string;
    startTrial: string;
    trialExhausted: string;
    exhaustedMessage: string;
    upgradeNow: string;
    lowCredits: string;
    lowCreditsMessage: string;
    lowCreditsWarning: string;
    exhaustedMonitor: string;
    invoicesRemaining: string;
    left: string;
    
    // Activation
    activateTitle: string;
    activateSubtitle: string;
    licenseKey: string;
    licenseKeyHint: string;
    thisDevice: string;
    activateButton: string;
    activating: string;
    activationSuccess: string;
    activationFailed: string;
    enterLicenseKey: string;
    
    // Help
    needHelp: string;
    helpDescription: string;
    howToActivate: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    dontHaveLicense: string;
    viewPricing: string;
    
    // Admin
    manageSubtitle: string;
    generateLicense: string;
    licenses: string;
    trials: string;
    suspicious: string;
    generateNewLicense: string;
    customer: string;
    customerEmail: string;
    customerName: string;
    companyName: string;
    licenseType: string;
    type: string;
    activations: string;
    expires: string;
    purchaseAmount: string;
    maxActivations: string;
    generate: string;
    revoke: string;
    confirmRevoke: string;
    licenseRevoked: string;
    deviceBound: string;
    credits: string;
    remaining: string;
    started: string;
    lastSeen: string;
    noLicenses: string;
    noTrials: string;
    noSuspicious: string;
    detected: string;
    action: string;
    error: string;
    viewDetails: string;
    upgradeToPro: string;
    upgradeDescription: string;
  };

  // Branding
  branding?: {
    title: string;
    subtitle: string;
    createNew: string;
    editBranding: string;
    createBranding: string;
    companyInfo: string;
    companyName: string;
    companyNameAr: string;
    tagline: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    businessWebsite: string;
    taxId: string;
    logo: string;
    colors: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    successColor: string;
    warningColor: string;
    errorColor: string;
    receiptSettings: string;
    receiptHeader: string;
    receiptFooter: string;
    active: string;
    activate: string;
    noBrandings: string;
    brandingCreated: string;
    brandingUpdated: string;
    brandingDeleted: string;
    brandingActivated: string;
    confirmDelete: string;
    uploading: string;
    dragToReplace: string;
    dropHere: string;
    dragOrClick: string;
    logoFormats: string;
    removeLogo: string;
    themePresets: string;
    presetsSubtitle: string;
    selectBranding: string;
    chooseBranding: string;
    builtin: string;
    usedTimes: string;
    times: string;
    applyTheme: string;
    noPresets: string;
    selectBrandingFirst: string;
    confirmApplyPreset: string;
    themeApplied: string;
    howItWorks: string;
    howStep1: string;
    howStep2: string;
    howStep3: string;
    howStep4: string;
  };

  // Validation Messages
  validation: {
    required: string;
    invalid: string;
    tooShort: string;
    tooLong: string;
    mustBeNumber: string;
    mustBePositive: string;
    mustBeEmail: string;
    passwordMismatch: string;
    insufficientStock: string;
    invalidCredentials: string;
    sessionExpired: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
  };

  // Success Messages
  success: {
    created: string;
    updated: string;
    deleted: string;
    saved: string;
    processed: string;
    approved: string;
    rejected: string;
    completed: string;
    cancelled: string;
    sessionStarted: string;
    sessionEnded: string;
    paymentProcessed: string;
    invoiceCreated: string;
  };

  // Error Messages
  errors: {
    failed: string;
    createFailed: string;
    updateFailed: string;
    deleteFailed: string;
    loadFailed: string;
    processingFailed: string;
    networkError: string;
    tryAgain: string;
  };

  // Confirmations
  confirmations: {
    confirmDelete: string;
    confirmArchive: string;
    confirmRestore: string;
    confirmCancel: string;
    confirmApprove: string;
    confirmReject: string;
    areYouSure: string;
    cannotBeUndone: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      search: 'Search',
      filter: 'Filter',
      clear: 'Clear',
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      actions: 'Actions',
      status: 'Status',
      date: 'Date',
      time: 'Time',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      tax: 'Tax',
      price: 'Price',
      quantity: 'Quantity',
      amount: 'Amount',
      description: 'Description',
      notes: 'Notes',
      active: 'Active',
      inactive: 'Inactive',
      all: 'All',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      inventoryPro: 'Inventory Pro',
    },

    nav: {
      dashboard: 'Dashboard',
      products: 'Products',
      categories: 'Categories',
      suppliers: 'Suppliers',
      customers: 'Customers',
      inventory: 'Inventory',
      stockAdjustments: 'Stock Adjustments',
      purchaseOrders: 'Purchase Orders',
      goodsReceipt: 'Goods Receipt',
      stockMovements: 'Stock Movements',
      sales: 'Sales',
      pos: 'POS',
      salesOrders: 'Sales Orders',
      invoices: 'Invoices',
      payments: 'Payments',
      users: 'Users',
      auditLogs: 'Audit Logs',
      settings: 'Settings',
      logout: 'Logout',
      profile: 'My Profile',
      changePassword: 'Change Password',
      sessions: 'Sessions',
      ocrScanner: 'OCR Scanner',
    },

    auth: {
      login: 'Login',
      logout: 'Logout',
      username: 'Username',
      password: 'Password',
      email: 'Email',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password?',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      register: 'Register',
      confirmPassword: 'Confirm Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      passwordStrength: 'Password Strength',
      weak: 'Weak',
      medium: 'Medium',
      strong: 'Strong',
      veryStrong: 'Very Strong',
      owner: 'Owner',
      admin: 'Admin',
      cashier: 'Cashier',
      inventoryManager: 'Inventory Manager',
      guest: 'Guest',
    },

    dashboard: {
      welcome: 'Welcome',
      statistics: 'Statistics',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      totalUsers: 'Total Users',
      totalProducts: 'Total Products',
      totalCustomers: 'Total Customers',
      totalSales: 'Total Sales',
      lowStock: 'Low Stock',
      pendingOrders: 'Pending Orders',
      todayRevenue: "Today's Revenue",
      thisMonth: 'This Month',
      thisWeek: 'This Week',
      today: 'Today',
      systemToday: 'Here\'s what\'s happening with your system today.',
      userManagement: 'User Management',
    },

    receipt: {
      title: 'Receipt',
      print: 'Print',
      email: 'Email',
      reprint: 'Reprint',
      emailTo: 'Email Receipt To',
      send: 'Send',
    },

    analytics: {
      title: 'Analytics',
      salesOverview: 'Sales Overview',
      trends: 'Trends',
      topProducts: 'Top Products',
      cashierPerformance: 'Cashier Performance',
      paymentMethods: 'Payment Methods',
      dateRange: 'Date Range',
      from: 'From',
      to: 'To',
      generate: 'Generate Report',
      export: 'Export',
      totalTransactions: 'Total Transactions',
      averageTransaction: 'Average Transaction',
      uniqueCustomers: 'Unique Customers',
      bestDay: 'Best Day',
      worstDay: 'Worst Day',
      hourlySales: 'Hourly Sales',
      summary: 'Summary',
    },

    reports: {
      title: 'Reports',
      zReport: 'Z-Report (End of Day)',
      xReport: 'X-Report (Mid-Day)',
      topItems: 'Top Selling Items',
      salesByHour: 'Sales by Hour',
      discountLeakage: 'Discount Leakage',
      generateReport: 'Generate Report',
      reportType: 'Report Type',
      sessionId: 'Session ID',
      reportResults: 'Report Results',
      printReport: 'Print Report',
      exportJson: 'Export JSON',
    },

    printSettingsConfig: {
      printSettings: 'Print Settings',
      businessInformation: 'Business Information',
      receiptContent: 'Receipt Content',
      printOptions: 'Print Options',
      paperSettings: 'Paper Settings',
      businessName: 'Business Name',
      businessPhone: 'Business Phone',
      businessEmail: 'Business Email',
      businessAddress: 'Business Address',
      taxId: 'Tax ID / VAT Number',
      headerText: 'Header Text',
      footerText: 'Footer Text',
      returnPolicy: 'Return Policy',
      printQrCode: 'Print QR Code',
      printBarcode: 'Print Barcode',
      showTaxBreakdown: 'Show Tax Breakdown',
      showCashierName: 'Show Cashier Name',
      showCustomerInfo: 'Show Customer Info',
      paperWidth: 'Paper Width (mm)',
      fontSize: 'Font Size (pt)',
      reset: 'Reset',
    },

    products: {
      products: 'Products',
      product: 'Product',
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      deleteProduct: 'Delete Product',
      productDetails: 'Product Details',
      sku: 'SKU',
      barcode: 'Barcode',
      name: 'Product Name',
      category: 'Category',
      brand: 'Brand',
      price: 'Selling Price',
      cost: 'Cost Price',
      stock: 'Stock',
      reorderLevel: 'Reorder Level',
      reorderQuantity: 'Reorder Quantity',
      maxStockLevel: 'Max Stock Level',
      location: 'Location',
      unit: 'Unit',
      uom: 'Unit of Measure',
      image: 'Image',
      images: 'Images',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      lowStock: 'Low Stock',
      archived: 'Archived',
      restore: 'Restore',
      archive: 'Archive',
      browseProducts: 'Browse and manage products',
      manageInventory: 'Manage your product inventory',
    },

    categories: {
      categories: 'Categories',
      category: 'Category',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      deleteCategory: 'Delete Category',
      parentCategory: 'Parent Category',
      subcategories: 'Subcategories',
      productCount: 'Product Count',
      sortOrder: 'Sort Order',
    },

    suppliers: {
      suppliers: 'Suppliers',
      supplier: 'Supplier',
      addSupplier: 'Add Supplier',
      editSupplier: 'Edit Supplier',
      supplierDetails: 'Supplier Details',
      contactPerson: 'Contact Person',
      phone: 'Phone',
      address: 'Address',
      taxId: 'Tax ID',
      paymentTerms: 'Payment Terms',
    },

    customers: {
      customers: 'Customers',
      customer: 'Customer',
      addCustomer: 'Add Customer',
      editCustomer: 'Edit Customer',
      customerDetails: 'Customer Details',
      firstName: 'First Name',
      lastName: 'Last Name',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      state: 'State',
      postalCode: 'Postal Code',
      country: 'Country',
      companyName: 'Company Name',
      taxId: 'Tax ID',
      creditLimit: 'Credit Limit',
      paymentTerms: 'Payment Terms',
      discountPercentage: 'Discount %',
      vip: 'VIP',
      customerNumber: 'Customer Number',
      purchaseHistory: 'Purchase History',
    },

    inventory: {
      inventory: 'Inventory',
      stockQuantity: 'Stock Quantity',
      stockLevel: 'Stock Level',
      stockMovement: 'Stock Movement',
      stockMovements: 'Stock Movements',
      stockAdjustment: 'Stock Adjustment',
      stockAdjustments: 'Stock Adjustments',
      adjustStock: 'Adjust Stock',
      currentStock: 'Current Stock',
      newQuantity: 'New Quantity',
      difference: 'Difference',
      reason: 'Reason',
      damage: 'Damage',
      theft: 'Theft',
      countError: 'Count Error',
      expired: 'Expired',
      lost: 'Lost',
      other: 'Other',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      approve: 'Approve',
      reject: 'Reject',
      managePurchaseOrders: 'Create and manage purchase orders',
      createPurchaseOrder: 'Create Purchase Order',
      completeReceipt: 'Complete Goods Receipt',
      auditTrail: 'Complete audit trail of all stock changes',
    },

    purchaseOrders: {
      purchaseOrders: 'Purchase Orders',
      purchaseOrder: 'Purchase Order',
      createPO: 'Create Purchase Order',
      poNumber: 'PO Number',
      supplier: 'Supplier',
      status: 'Status',
      totalAmount: 'Total Amount',
      expectedDate: 'Expected Date',
      items: 'Items',
      unitPrice: 'Unit Price',
      lineTotal: 'Line Total',
      draft: 'Draft',
      submitted: 'Submitted',
      approved: 'Approved',
      received: 'Received',
      cancelled: 'Cancelled',
      approvePO: 'Approve PO',
    },

    goodsReceipt: {
      goodsReceipt: 'Goods Receipt',
      createGRN: 'Create GRN',
      grnNumber: 'GRN Number',
      receivedQuantity: 'Received Quantity',
      damagedQuantity: 'Damaged Quantity',
      receiveGoods: 'Receive Goods',
      complete: 'Complete',
      partial: 'Partial',
      withDiscrepancy: 'With Discrepancy',
    },

    sales: {
      sales: 'Sales',
      salesOrder: 'Sales Order',
      salesOrders: 'Sales Orders',
      createOrder: 'Create Order',
      orderNumber: 'Order Number',
      orderDate: 'Order Date',
      requiredDate: 'Required Date',
      shippedDate: 'Shipped Date',
      deliveredDate: 'Delivered Date',
      shippingAddress: 'Shipping Address',
      orderStatus: 'Order Status',
      draft: 'Draft',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned',
    },

    invoices: {
      invoices: 'Invoices',
      invoice: 'Invoice',
      createInvoice: 'Create Invoice',
      invoiceNumber: 'Invoice Number',
      invoiceDate: 'Invoice Date',
      dueDate: 'Due Date',
      paidDate: 'Paid Date',
      invoiceStatus: 'Invoice Status',
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      subtotal: 'Subtotal',
      taxAmount: 'Tax Amount',
      discountAmount: 'Discount Amount',
      totalAmount: 'Total Amount',
      paidAmount: 'Paid Amount',
      balanceAmount: 'Balance Amount',
      terms: 'Terms',
    },

    payments: {
      payments: 'Payments',
      payment: 'Payment',
      processPayment: 'Process Payment',
      paymentNumber: 'Payment Number',
      paymentMethod: 'Payment Method',
      paymentDate: 'Payment Date',
      paymentStatus: 'Payment Status',
      cash: 'Cash',
      creditCard: 'Credit Card',
      debitCard: 'Debit Card',
      bankTransfer: 'Bank Transfer',
      check: 'Check',
      storeCredit: 'Store Credit',
      other: 'Other',
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded',
      partiallyRefunded: 'Partially Refunded',
      referenceNumber: 'Reference Number',
      amountTendered: 'Amount Tendered',
      change: 'Change',
    },

    ocr: {
      ocrScanner: 'OCR Scanner',
      uploadDocument: 'Upload Document',
      documentType: 'Document Type',
      receipt: 'Receipt',
      invoice: 'Invoice',
      purchaseOrder: 'Purchase Order',
      priceList: 'Price List',
      referenceNumber: 'Reference Number',
      uploadAndProcess: 'Upload & Process',
      processing: 'Processing OCR...',
      extractedProducts: 'Extracted Products',
      reviewProducts: 'Review Products',
      confidence: 'Confidence',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      addToInventory: 'Add to Inventory',
      bulkAdd: 'Bulk Add',
      approve: 'Approve',
      correct: 'Correct',
      matched: 'Matched with',
      newProduct: 'New Product',
      scanCompleted: 'Scan Completed',
      productsFound: 'Products Found',
    },

    pos: {
      pos: 'POS',
      pointOfSale: 'Point of Sale',
      session: 'Session',
      startSession: 'Start Session',
      endSession: 'End Session',
      sessionNumber: 'Session Number',
      cashier: 'Cashier',
      startingCash: 'Starting Cash',
      endingCash: 'Ending Cash',
      totalSales: 'Total Sales',
      totalTransactions: 'Total Transactions',
      sessionSummary: 'Session Summary',
      cart: 'Cart',
      clearCart: 'Clear Cart',
      addToCart: 'Add to Cart',
      removeFromCart: 'Remove from Cart',
      customer: 'Customer',
      walkInCustomer: 'Walk-in Customer',
      selectCustomer: 'Select Customer',
      selectPaymentMethod: 'Select Payment Method',
      processSale: 'Process Sale',
      processing: 'Processing...',
      saleCompleted: 'Sale Completed',
      transactionNumber: 'Transaction Number',
      change: 'Change',
      receipt: 'Receipt',
      printReceipt: 'Print Receipt',
      startingSession: 'Starting POS Session...',
    },

    users: {
      users: 'Users',
      user: 'User',
      addUser: 'Add User',
      editUser: 'Edit User',
      userDetails: 'User Details',
      displayName: 'Display Name',
      role: 'Role',
      owner: 'Owner',
      admin: 'Admin',
      cashier: 'Cashier',
      inventoryManager: 'Inventory Manager',
      guest: 'Guest',
      active: 'Active',
      inactive: 'Inactive',
      lastLogin: 'Last Login',
      createdBy: 'Created By',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
    },

    audit: {
      auditLogs: 'Audit Logs',
      auditLog: 'Audit Log',
      action: 'Action',
      actor: 'Actor',
      target: 'Target',
      metadata: 'Metadata',
      ipAddress: 'IP Address',
      userAgent: 'User Agent',
      timestamp: 'Timestamp',
    },

    settings: {
      settings: 'Settings',
      generalSettings: 'General Settings',
      securitySettings: 'Security Settings',
      languageSettings: 'Language Settings',
      language: 'Language',
      english: 'English',
      arabic: 'Arabic',
      theme: 'Theme',
      notifications: 'Notifications',
      activeSessions: 'Active Sessions',
      revokeSession: 'Revoke Session',
      revokeAllSessions: 'Revoke All Sessions',
    },

    notifications: {
      notifications: 'Notifications',
      unreadNotifications: 'Unread Notifications',
      markAllRead: 'Mark All Read',
      markAsRead: 'Mark as Read',
      dismiss: 'Dismiss',
      viewAll: 'View All Notifications',
      noNotifications: 'No notifications',
      allCaughtUp: "You're all caught up!",
      stockAlerts: 'Stock Alerts',
      purchaseOrders: 'Purchase Orders',
      payments: 'Payments',
      systemAlerts: 'System Alerts',
      unread: 'Unread',
      all: 'All',
      settings: 'Notification Settings',
      preferences: 'Notification Preferences',
      channels: 'Notification Channels',
      notificationTypes: 'Notification Types',
      quietHours: 'Quiet Hours',
      dailyDigest: 'Daily Digest',
      enableInApp: 'In-App Notifications',
      enableEmail: 'Email Notifications',
      enableSMS: 'SMS Notifications',
      enablePush: 'Push Notifications',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    },

    licensing: {
      // Pages
      trialDashboard: 'Trial Dashboard',
      licenseManagement: 'License Management',
      activateLicense: 'Activate License',
      
      // Trial Status
      trialSubtitle: 'Monitor your trial usage and upgrade to full version',
      creditsRemaining: 'Credits Remaining',
      creditsUsed: 'Credits Used',
      status: 'Status',
      trialStarted: 'Trial Started',
      deviceInfo: 'Device Information',
      trialGuestId: 'Trial Guest ID',
      deviceFingerprint: 'Device Fingerprint',
      recentActivity: 'Recent Activity',
      
      // Status Messages
      noTrial: 'No Trial Found',
      startTrialPrompt: 'Start your free trial to get 50 free invoices!',
      startTrial: 'Start Free Trial',
      trialExhausted: 'Trial Exhausted',
      exhaustedMessage: 'You have used all 50 free invoices. Upgrade to continue using the software.',
      upgradeNow: 'Upgrade Now',
      lowCredits: 'Low Credits Warning',
      lowCreditsMessage: 'invoices remaining. Consider upgrading soon.',
      lowCreditsWarning: 'Low Credits',
      exhaustedMonitor: '0 invoices remaining',
      invoicesRemaining: 'invoices remaining',
      left: 'left',
      
      // Activation
      activateTitle: 'Activate Your License',
      activateSubtitle: 'Enter your license key to unlock the full version',
      licenseKey: 'License Key',
      licenseKeyHint: 'Enter the 32-character license key you received via email',
      thisDevice: 'This Device:',
      activateButton: 'Activate License',
      activating: 'Activating...',
      activationSuccess: 'License activated successfully! Welcome to the full version.',
      activationFailed: 'Activation Failed',
      enterLicenseKey: 'Please enter a license key',
      
      // Help
      needHelp: 'Need Help?',
      helpDescription: 'Contact support for assistance with activation or billing questions.',
      howToActivate: 'How to Activate',
      step1: 'Purchase a license from our website or contact sales',
      step2: 'You will receive a 32-character license key via email',
      step3: 'Enter the license key above and click "Activate License"',
      step4: 'Your software will be activated and all features unlocked',
      dontHaveLicense: "Don't have a license yet?",
      viewPricing: 'View Pricing & Purchase',
      
      // Admin
      manageSubtitle: 'Manage licenses, trials, and monitor suspicious activities',
      generateLicense: '+ Generate License',
      licenses: 'Licenses',
      trials: 'Trials',
      suspicious: 'Suspicious',
      generateNewLicense: 'Generate New License',
      customer: 'Customer',
      customerEmail: 'Customer Email',
      customerName: 'Customer Name',
      companyName: 'Company Name',
      licenseType: 'License Type',
      type: 'Type',
      activations: 'Activations',
      expires: 'Expires',
      purchaseAmount: 'Purchase Amount',
      maxActivations: 'Max Activations',
      generate: 'Generate License',
      revoke: 'Revoke',
      confirmRevoke: 'Are you sure you want to revoke this license?',
      licenseRevoked: 'License revoked successfully',
      deviceBound: 'Device Bound',
      credits: 'Credits',
      remaining: 'Remaining',
      started: 'Started',
      lastSeen: 'Last Seen',
      noLicenses: 'No licenses generated yet',
      noTrials: 'No trial sessions found',
      noSuspicious: 'No suspicious activities detected',
      detected: 'Detected',
      action: 'Action',
      error: 'Error',
      viewDetails: 'View Details',
      upgradeToPro: 'Upgrade to Professional',
      upgradeDescription: 'Get unlimited invoices, advanced features, and priority support.',
    },

    branding: {
      title: 'Branding Management',
      subtitle: 'Customize your company branding, colors, and logos',
      createNew: '+ Create Branding',
      editBranding: 'Edit Branding Profile',
      createBranding: 'Create Branding Profile',
      companyInfo: 'Company Information',
      companyName: 'Company Name',
      companyNameAr: 'Company Name (Arabic)',
      tagline: 'Tagline',
      businessAddress: 'Business Address',
      businessPhone: 'Business Phone',
      businessEmail: 'Business Email',
      businessWebsite: 'Business Website',
      taxId: 'Tax ID',
      logo: 'Logo',
      colors: 'Brand Colors',
      primaryColor: 'Primary Color',
      secondaryColor: 'Secondary Color',
      accentColor: 'Accent Color',
      successColor: 'Success Color',
      warningColor: 'Warning Color',
      errorColor: 'Error Color',
      receiptSettings: 'Receipt Settings',
      receiptHeader: 'Receipt Header Text',
      receiptFooter: 'Receipt Footer Text',
      active: 'Active',
      activate: 'Activate',
      noBrandings: 'No branding profiles yet. Create one to get started!',
      brandingCreated: 'Branding profile created successfully!',
      brandingUpdated: 'Branding profile updated successfully!',
      brandingDeleted: 'Branding profile deleted!',
      brandingActivated: 'Branding activated!',
      confirmDelete: 'Are you sure you want to delete this branding profile?',
      uploading: 'Uploading...',
      dragToReplace: 'Drag a new logo to replace, or click to browse',
      dropHere: 'Drop logo here',
      dragOrClick: 'Drag & drop your logo, or click to browse',
      logoFormats: 'PNG, JPG, SVG up to 10MB',
      removeLogo: 'Remove Logo',
      themePresets: 'Theme Presets',
      presetsSubtitle: 'Choose from pre-made color themes or create your own',
      selectBranding: 'Select branding profile to apply theme:',
      chooseBranding: 'Choose branding profile...',
      builtin: 'Built-in',
      usedTimes: 'Used',
      times: 'times',
      applyTheme: 'Apply Theme',
      noPresets: 'No theme presets available',
      selectBrandingFirst: 'Please select a branding profile first',
      confirmApplyPreset: 'Apply this theme to your branding?',
      themeApplied: 'Theme applied successfully!',
      howItWorks: 'How it works',
      howStep1: 'Select a branding profile from the dropdown above',
      howStep2: 'Click "Apply Theme" on any preset to update colors',
      howStep3: 'Your branding colors will be updated instantly',
      howStep4: 'You can always customize colors further in Branding Management',
    },

    validation: {
      required: 'This field is required',
      invalid: 'Invalid input',
      tooShort: 'Too short',
      tooLong: 'Too long',
      mustBeNumber: 'Must be a number',
      mustBePositive: 'Must be positive',
      mustBeEmail: 'Must be a valid email',
      passwordMismatch: 'Passwords do not match',
      insufficientStock: 'Insufficient stock',
      invalidCredentials: 'Invalid credentials',
      sessionExpired: 'Session expired',
      unauthorized: 'Unauthorized access',
      forbidden: 'Forbidden',
      notFound: 'Not found',
      serverError: 'Server error',
    },

    success: {
      created: 'Created successfully',
      updated: 'Updated successfully',
      deleted: 'Deleted successfully',
      saved: 'Saved successfully',
      processed: 'Processed successfully',
      approved: 'Approved successfully',
      rejected: 'Rejected successfully',
      completed: 'Completed successfully',
      cancelled: 'Cancelled successfully',
      sessionStarted: 'Session started successfully',
      sessionEnded: 'Session ended successfully',
      paymentProcessed: 'Payment processed successfully',
      invoiceCreated: 'Invoice created successfully',
    },

    errors: {
      failed: 'Operation failed',
      createFailed: 'Failed to create',
      updateFailed: 'Failed to update',
      deleteFailed: 'Failed to delete',
      loadFailed: 'Failed to load',
      processingFailed: 'Processing failed',
      networkError: 'Network error',
      tryAgain: 'Please try again',
    },

    confirmations: {
      confirmDelete: 'Are you sure you want to delete this?',
      confirmArchive: 'Are you sure you want to archive this?',
      confirmRestore: 'Are you sure you want to restore this?',
      confirmCancel: 'Are you sure you want to cancel?',
      confirmApprove: 'Are you sure you want to approve?',
      confirmReject: 'Are you sure you want to reject?',
      areYouSure: 'Are you sure?',
      cannotBeUndone: 'This action cannot be undone',
    },
  },

  ar: {
    common: {
      loading: 'جاري التحميل...',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      create: 'إنشاء',
      update: 'تحديث',
      search: 'بحث',
      filter: 'تصفية',
      clear: 'مسح',
      submit: 'إرسال',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      close: 'إغلاق',
      confirm: 'تأكيد',
      yes: 'نعم',
      no: 'لا',
      actions: 'الإجراءات',
      status: 'الحالة',
      date: 'التاريخ',
      time: 'الوقت',
      total: 'المجموع',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      tax: 'الضريبة',
      price: 'السعر',
      quantity: 'الكمية',
      amount: 'المبلغ',
      description: 'الوصف',
      notes: 'ملاحظات',
      active: 'نشط',
      inactive: 'غير نشط',
      all: 'الكل',
      view: 'عرض',
      download: 'تنزيل',
      upload: 'رفع',
      success: 'نجاح',
      error: 'خطأ',
      warning: 'تحذير',
      info: 'معلومات',
      inventoryPro: 'برو المخزون',
    },

    nav: {
      dashboard: 'لوحة القيادة',
      products: 'المنتجات',
      categories: 'الفئات',
      suppliers: 'الموردين',
      customers: 'العملاء',
      inventory: 'المخزون',
      stockAdjustments: 'تعديلات المخزون',
      purchaseOrders: 'أوامر الشراء',
      goodsReceipt: 'استلام البضائع',
      stockMovements: 'حركات المخزون',
      sales: 'المبيعات',
      pos: 'نقطة البيع',
      salesOrders: 'أوامر المبيعات',
      invoices: 'الفواتير',
      payments: 'المدفوعات',
      users: 'المستخدمين',
      auditLogs: 'سجلات المراجعة',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      profile: 'ملفي الشخصي',
      changePassword: 'تغيير كلمة المرور',
      sessions: 'الجلسات',
      ocrScanner: 'ماسح OCR',
    },

    auth: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      email: 'البريد الإلكتروني',
      rememberMe: 'تذكرني',
      forgotPassword: 'نسيت كلمة المرور؟',
      signIn: 'تسجيل الدخول',
      signUp: 'التسجيل',
      register: 'إنشاء حساب',
      confirmPassword: 'تأكيد كلمة المرور',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      passwordStrength: 'قوة كلمة المرور',
      weak: 'ضعيفة',
      medium: 'متوسطة',
      strong: 'قوية',
      veryStrong: 'قوية جداً',
      owner: 'المالك',
      admin: 'مدير',
      cashier: 'أمين صندوق',
      inventoryManager: 'مدير المخزون',
      guest: 'ضيف',
    },

    dashboard: {
      welcome: 'مرحباً',
      statistics: 'الإحصائيات',
      recentActivity: 'النشاط الأخير',
      quickActions: 'إجراءات سريعة',
      totalUsers: 'إجمالي المستخدمين',
      totalProducts: 'إجمالي المنتجات',
      totalCustomers: 'إجمالي العملاء',
      totalSales: 'إجمالي المبيعات',
      lowStock: 'مخزون منخفض',
      pendingOrders: 'الطلبات المعلقة',
      todayRevenue: 'إيرادات اليوم',
      thisMonth: 'هذا الشهر',
      thisWeek: 'هذا الأسبوع',
      today: 'اليوم',
      systemToday: 'إليك ما يحدث في نظامك اليوم.',
      userManagement: 'إدارة المستخدمين',
    },

    receipt: {
      title: 'إيصال',
      print: 'طباعة',
      email: 'بريد إلكتروني',
      reprint: 'إعادة طباعة',
      emailTo: 'إرسال الإيصال إلى',
      send: 'إرسال',
    },

    analytics: {
      title: 'التحليلات',
      salesOverview: 'نظرة عامة على المبيعات',
      trends: 'الاتجاهات',
      topProducts: 'أفضل المنتجات',
      cashierPerformance: 'أداء أمناء الصندوق',
      paymentMethods: 'طرق الدفع',
      dateRange: 'نطاق التاريخ',
      from: 'من',
      to: 'إلى',
      generate: 'إنشاء تقرير',
      export: 'تصدير',
      totalTransactions: 'إجمالي المعاملات',
      averageTransaction: 'متوسط المعاملة',
      uniqueCustomers: 'عملاء فريدون',
      bestDay: 'أفضل يوم',
      worstDay: 'أسوأ يوم',
      hourlySales: 'المبيعات بالساعة',
      summary: 'ملخص',
    },

    reports: {
      title: 'التقارير',
      zReport: 'تقرير Z (نهاية اليوم)',
      xReport: 'تقرير X (منتصف اليوم)',
      topItems: 'المنتجات الأكثر مبيعاً',
      salesByHour: 'المبيعات حسب الساعة',
      discountLeakage: 'تسرب الخصومات',
      generateReport: 'إنشاء تقرير',
      reportType: 'نوع التقرير',
      sessionId: 'معرف الجلسة',
      reportResults: 'نتائج التقرير',
      printReport: 'طباعة التقرير',
      exportJson: 'تصدير JSON',
    },

    printSettingsConfig: {
      printSettings: 'إعدادات الطباعة',
      businessInformation: 'معلومات العمل',
      receiptContent: 'محتوى الإيصال',
      printOptions: 'خيارات الطباعة',
      paperSettings: 'إعدادات الورق',
      businessName: 'اسم العمل',
      businessPhone: 'هاتف العمل',
      businessEmail: 'بريد العمل الإلكتروني',
      businessAddress: 'عنوان العمل',
      taxId: 'الرقم الضريبي / رقم الضريبة',
      headerText: 'نص الرأس',
      footerText: 'نص التذييل',
      returnPolicy: 'سياسة الإرجاع',
      printQrCode: 'طباعة رمز QR',
      printBarcode: 'طباعة الباركود',
      showTaxBreakdown: 'إظهار تفصيل الضريبة',
      showCashierName: 'إظهار اسم أمين الصندوق',
      showCustomerInfo: 'إظهار معلومات العميل',
      paperWidth: 'عرض الورق (مم)',
      fontSize: 'حجم الخط (نقطة)',
      reset: 'إعادة تعيين',
    },

    products: {
      products: 'المنتجات',
      product: 'منتج',
      addProduct: 'إضافة منتج',
      editProduct: 'تعديل المنتج',
      deleteProduct: 'حذف المنتج',
      productDetails: 'تفاصيل المنتج',
      sku: 'رمز المنتج',
      barcode: 'الباركود',
      name: 'اسم المنتج',
      category: 'الفئة',
      brand: 'العلامة التجارية',
      price: 'سعر البيع',
      cost: 'سعر التكلفة',
      stock: 'المخزون',
      reorderLevel: 'مستوى إعادة الطلب',
      reorderQuantity: 'كمية إعادة الطلب',
      maxStockLevel: 'الحد الأقصى للمخزون',
      location: 'الموقع',
      unit: 'الوحدة',
      uom: 'وحدة القياس',
      image: 'صورة',
      images: 'الصور',
      inStock: 'متوفر',
      outOfStock: 'غير متوفر',
      lowStock: 'مخزون منخفض',
      archived: 'مؤرشف',
      restore: 'استعادة',
      archive: 'أرشفة',
      browseProducts: 'تصفح وإدارة المنتجات',
      manageInventory: 'إدارة مخزون المنتجات',
    },

    categories: {
      categories: 'الفئات',
      category: 'فئة',
      addCategory: 'إضافة فئة',
      editCategory: 'تعديل الفئة',
      deleteCategory: 'حذف الفئة',
      parentCategory: 'الفئة الرئيسية',
      subcategories: 'الفئات الفرعية',
      productCount: 'عدد المنتجات',
      sortOrder: 'ترتيب الفرز',
    },

    suppliers: {
      suppliers: 'الموردين',
      supplier: 'مورد',
      addSupplier: 'إضافة مورد',
      editSupplier: 'تعديل المورد',
      supplierDetails: 'تفاصيل المورد',
      contactPerson: 'الشخص المسؤول',
      phone: 'الهاتف',
      address: 'العنوان',
      taxId: 'الرقم الضريبي',
      paymentTerms: 'شروط الدفع',
    },

    customers: {
      customers: 'العملاء',
      customer: 'عميل',
      addCustomer: 'إضافة عميل',
      editCustomer: 'تعديل العميل',
      customerDetails: 'تفاصيل العميل',
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      address: 'العنوان',
      city: 'المدينة',
      state: 'المحافظة',
      postalCode: 'الرمز البريدي',
      country: 'البلد',
      companyName: 'اسم الشركة',
      taxId: 'الرقم الضريبي',
      creditLimit: 'حد الائتمان',
      paymentTerms: 'شروط الدفع',
      discountPercentage: 'نسبة الخصم %',
      vip: 'عميل VIP',
      customerNumber: 'رقم العميل',
      purchaseHistory: 'سجل المشتريات',
    },

    inventory: {
      inventory: 'المخزون',
      stockQuantity: 'كمية المخزون',
      stockLevel: 'مستوى المخزون',
      stockMovement: 'حركة المخزون',
      stockMovements: 'حركات المخزون',
      stockAdjustment: 'تعديل المخزون',
      stockAdjustments: 'تعديلات المخزون',
      adjustStock: 'تعديل المخزون',
      currentStock: 'المخزون الحالي',
      newQuantity: 'الكمية الجديدة',
      difference: 'الفرق',
      reason: 'السبب',
      damage: 'تلف',
      theft: 'سرقة',
      countError: 'خطأ في العد',
      expired: 'منتهي الصلاحية',
      lost: 'مفقود',
      other: 'أخرى',
      pending: 'قيد الانتظار',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      approve: 'موافقة',
      reject: 'رفض',
      managePurchaseOrders: 'إنشاء وإدارة أوامر الشراء',
      createPurchaseOrder: 'إنشاء أمر شراء',
      completeReceipt: 'إتمام استلام البضائع',
      auditTrail: 'سجل تدقيق كامل لجميع تغييرات المخزون',
    },

    purchaseOrders: {
      purchaseOrders: 'أوامر الشراء',
      purchaseOrder: 'أمر شراء',
      createPO: 'إنشاء أمر شراء',
      poNumber: 'رقم أمر الشراء',
      supplier: 'المورد',
      status: 'الحالة',
      totalAmount: 'المبلغ الإجمالي',
      expectedDate: 'تاريخ الاستلام المتوقع',
      items: 'الأصناف',
      unitPrice: 'سعر الوحدة',
      lineTotal: 'إجمالي السطر',
      draft: 'مسودة',
      submitted: 'مقدم',
      approved: 'موافق عليه',
      received: 'مستلم',
      cancelled: 'ملغي',
      approvePO: 'الموافقة على أمر الشراء',
    },

    goodsReceipt: {
      goodsReceipt: 'استلام البضائع',
      createGRN: 'إنشاء إيصال استلام',
      grnNumber: 'رقم إيصال الاستلام',
      receivedQuantity: 'الكمية المستلمة',
      damagedQuantity: 'الكمية التالفة',
      receiveGoods: 'استلام البضائع',
      complete: 'كامل',
      partial: 'جزئي',
      withDiscrepancy: 'مع تباين',
    },

    sales: {
      sales: 'المبيعات',
      salesOrder: 'أمر بيع',
      salesOrders: 'أوامر البيع',
      createOrder: 'إنشاء أمر',
      orderNumber: 'رقم الأمر',
      orderDate: 'تاريخ الأمر',
      requiredDate: 'التاريخ المطلوب',
      shippedDate: 'تاريخ الشحن',
      deliveredDate: 'تاريخ التسليم',
      shippingAddress: 'عنوان الشحن',
      orderStatus: 'حالة الأمر',
      draft: 'مسودة',
      confirmed: 'مؤكد',
      processing: 'قيد المعالجة',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
      returned: 'مرتجع',
    },

    invoices: {
      invoices: 'الفواتير',
      invoice: 'فاتورة',
      createInvoice: 'إنشاء فاتورة',
      invoiceNumber: 'رقم الفاتورة',
      invoiceDate: 'تاريخ الفاتورة',
      dueDate: 'تاريخ الاستحقاق',
      paidDate: 'تاريخ الدفع',
      invoiceStatus: 'حالة الفاتورة',
      draft: 'مسودة',
      sent: 'تم الإرسال',
      paid: 'مدفوعة',
      overdue: 'متأخرة',
      cancelled: 'ملغاة',
      refunded: 'مستردة',
      subtotal: 'المجموع الفرعي',
      taxAmount: 'مبلغ الضريبة',
      discountAmount: 'مبلغ الخصم',
      totalAmount: 'المبلغ الإجمالي',
      paidAmount: 'المبلغ المدفوع',
      balanceAmount: 'المبلغ المتبقي',
      terms: 'الشروط',
    },

    payments: {
      payments: 'المدفوعات',
      payment: 'دفعة',
      processPayment: 'معالجة الدفعة',
      paymentNumber: 'رقم الدفعة',
      paymentMethod: 'طريقة الدفع',
      paymentDate: 'تاريخ الدفع',
      paymentStatus: 'حالة الدفع',
      cash: 'نقداً',
      creditCard: 'بطاقة ائتمان',
      debitCard: 'بطاقة خصم',
      bankTransfer: 'تحويل بنكي',
      check: 'شيك',
      storeCredit: 'رصيد المتجر',
      other: 'أخرى',
      pending: 'قيد الانتظار',
      completed: 'مكتملة',
      failed: 'فشلت',
      refunded: 'مستردة',
      partiallyRefunded: 'مستردة جزئياً',
      referenceNumber: 'الرقم المرجعي',
      amountTendered: 'المبلغ المدفوع',
      change: 'الباقي',
    },

    ocr: {
      ocrScanner: 'ماسح OCR',
      uploadDocument: 'تحميل المستند',
      documentType: 'نوع المستند',
      receipt: 'إيصال',
      invoice: 'فاتورة',
      purchaseOrder: 'أمر شراء',
      priceList: 'قائمة الأسعار',
      referenceNumber: 'الرقم المرجعي',
      uploadAndProcess: 'تحميل ومعالجة',
      processing: 'جاري معالجة OCR...',
      extractedProducts: 'المنتجات المستخرجة',
      reviewProducts: 'مراجعة المنتجات',
      confidence: 'الثقة',
      selectAll: 'تحديد الكل',
      deselectAll: 'إلغاء تحديد الكل',
      addToInventory: 'إضافة إلى المخزون',
      bulkAdd: 'إضافة جماعية',
      approve: 'موافقة',
      correct: 'تصحيح',
      matched: 'مطابق مع',
      newProduct: 'منتج جديد',
      scanCompleted: 'اكتمل المسح',
      productsFound: 'المنتجات الموجودة',
    },

    pos: {
      pos: 'نقطة البيع',
      pointOfSale: 'نقطة البيع',
      session: 'الجلسة',
      startSession: 'بدء الجلسة',
      endSession: 'إنهاء الجلسة',
      sessionNumber: 'رقم الجلسة',
      cashier: 'الكاشير',
      startingCash: 'النقد الافتتاحي',
      endingCash: 'النقد الختامي',
      totalSales: 'إجمالي المبيعات',
      totalTransactions: 'إجمالي المعاملات',
      sessionSummary: 'ملخص الجلسة',
      cart: 'السلة',
      clearCart: 'مسح السلة',
      addToCart: 'إضافة إلى السلة',
      removeFromCart: 'إزالة من السلة',
      customer: 'العميل',
      walkInCustomer: 'عميل عابر',
      selectCustomer: 'اختر العميل',
      selectPaymentMethod: 'اختر طريقة الدفع',
      processSale: 'إتمام البيع',
      processing: 'جاري المعالجة...',
      saleCompleted: 'تم البيع بنجاح',
      transactionNumber: 'رقم المعاملة',
      change: 'الباقي',
      startingSession: 'جاري بدء جلسة نقطة البيع...',
      receipt: 'الإيصال',
      printReceipt: 'طباعة الإيصال',
    },

    users: {
      users: 'المستخدمين',
      user: 'مستخدم',
      addUser: 'إضافة مستخدم',
      editUser: 'تعديل المستخدم',
      userDetails: 'تفاصيل المستخدم',
      displayName: 'الاسم المعروض',
      role: 'الدور',
      owner: 'المالك',
      admin: 'المسؤول',
      cashier: 'الكاشير',
      inventoryManager: 'مدير المخزون',
      guest: 'ضيف',
      active: 'نشط',
      inactive: 'غير نشط',
      lastLogin: 'آخر تسجيل دخول',
      createdBy: 'تم الإنشاء بواسطة',
      createdAt: 'تاريخ الإنشاء',
      updatedAt: 'تاريخ التحديث',
    },

    audit: {
      auditLogs: 'سجلات المراجعة',
      auditLog: 'سجل مراجعة',
      action: 'الإجراء',
      actor: 'الفاعل',
      target: 'الهدف',
      metadata: 'البيانات الوصفية',
      ipAddress: 'عنوان IP',
      userAgent: 'وكيل المستخدم',
      timestamp: 'الطابع الزمني',
    },

    settings: {
      settings: 'الإعدادات',
      generalSettings: 'الإعدادات العامة',
      securitySettings: 'إعدادات الأمان',
      languageSettings: 'إعدادات اللغة',
      language: 'اللغة',
      english: 'الإنجليزية',
      arabic: 'العربية',
      theme: 'المظهر',
      notifications: 'الإشعارات',
      activeSessions: 'الجلسات النشطة',
      revokeSession: 'إلغاء الجلسة',
      revokeAllSessions: 'إلغاء جميع الجلسات',
    },

    notifications: {
      notifications: 'الإشعارات',
      unreadNotifications: 'الإشعارات غير المقروءة',
      markAllRead: 'تحديد الكل كمقروء',
      markAsRead: 'تحديد كمقروء',
      dismiss: 'إخفاء',
      viewAll: 'عرض جميع الإشعارات',
      noNotifications: 'لا توجد إشعارات',
      allCaughtUp: 'لقد قرأت كل شيء!',
      stockAlerts: 'تنبيهات المخزون',
      purchaseOrders: 'أوامر الشراء',
      payments: 'المدفوعات',
      systemAlerts: 'تنبيهات النظام',
      unread: 'غير مقروء',
      all: 'الكل',
      settings: 'إعدادات الإشعارات',
      preferences: 'تفضيلات الإشعارات',
      channels: 'قنوات الإشعارات',
      notificationTypes: 'أنواع الإشعارات',
      quietHours: 'ساعات الهدوء',
      dailyDigest: 'الملخص اليومي',
      enableInApp: 'إشعارات داخل التطبيق',
      enableEmail: 'إشعارات البريد الإلكتروني',
      enableSMS: 'إشعارات الرسائل النصية',
      enablePush: 'الإشعارات الفورية',
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      critical: 'حرج',
    },

    licensing: {
      // Pages
      trialDashboard: 'لوحة التجربة',
      licenseManagement: 'إدارة التراخيص',
      activateLicense: 'تفعيل الترخيص',
      
      // Trial Status
      trialSubtitle: 'راقب استخدام التجربة وقم بالترقية إلى النسخة الكاملة',
      creditsRemaining: 'الأرصدة المتبقية',
      creditsUsed: 'الأرصدة المستخدمة',
      status: 'الحالة',
      trialStarted: 'بدء التجربة',
      deviceInfo: 'معلومات الجهاز',
      trialGuestId: 'معرف ضيف التجربة',
      deviceFingerprint: 'بصمة الجهاز',
      recentActivity: 'النشاط الأخير',
      
      // Status Messages
      noTrial: 'لم يتم العثور على تجربة',
      startTrialPrompt: 'ابدأ تجربتك المجانية للحصول على 50 فاتورة مجانية!',
      startTrial: 'ابدأ التجربة المجانية',
      trialExhausted: 'انتهت التجربة',
      exhaustedMessage: 'لقد استخدمت جميع الفواتير المجانية الخمسين. قم بالترقية للمتابعة.',
      upgradeNow: 'الترقية الآن',
      lowCredits: 'تحذير أرصدة منخفضة',
      lowCreditsMessage: 'فاتورة متبقية. فكر في الترقية قريباً.',
      lowCreditsWarning: 'أرصدة منخفضة',
      exhaustedMonitor: '0 فاتورة متبقية',
      invoicesRemaining: 'فاتورة متبقية',
      left: 'متبقي',
      
      // Activation
      activateTitle: 'تفعيل ترخيصك',
      activateSubtitle: 'أدخل مفتاح الترخيص لفتح النسخة الكاملة',
      licenseKey: 'مفتاح الترخيص',
      licenseKeyHint: 'أدخل مفتاح الترخيص المكون من 32 حرفاً الذي تلقيته عبر البريد الإلكتروني',
      thisDevice: 'هذا الجهاز:',
      activateButton: 'تفعيل الترخيص',
      activating: 'جاري التفعيل...',
      activationSuccess: 'تم تفعيل الترخيص بنجاح! مرحباً بك في النسخة الكاملة.',
      activationFailed: 'فشل التفعيل',
      enterLicenseKey: 'الرجاء إدخال مفتاح ترخيص',
      
      // Help
      needHelp: 'هل تحتاج مساعدة؟',
      helpDescription: 'اتصل بالدعم للحصول على المساعدة في التفعيل أو أسئلة الفوترة.',
      howToActivate: 'كيفية التفعيل',
      step1: 'اشترِ ترخيصاً من موقعنا أو اتصل بالمبيعات',
      step2: 'ستتلقى مفتاح ترخيص مكون من 32 حرفاً عبر البريد الإلكتروني',
      step3: 'أدخل مفتاح الترخيص أعلاه وانقر على "تفعيل الترخيص"',
      step4: 'سيتم تفعيل برنامجك وفتح جميع الميزات',
      dontHaveLicense: 'لا تملك ترخيصاً بعد؟',
      viewPricing: 'عرض الأسعار والشراء',
      
      // Admin
      manageSubtitle: 'إدارة التراخيص والتجارب ومراقبة الأنشطة المشبوهة',
      generateLicense: '+ إنشاء ترخيص',
      licenses: 'التراخيص',
      trials: 'التجارب',
      suspicious: 'مشبوه',
      generateNewLicense: 'إنشاء ترخيص جديد',
      customer: 'العميل',
      customerEmail: 'بريد العميل الإلكتروني',
      customerName: 'اسم العميل',
      companyName: 'اسم الشركة',
      licenseType: 'نوع الترخيص',
      type: 'النوع',
      activations: 'التفعيلات',
      expires: 'ينتهي',
      purchaseAmount: 'مبلغ الشراء',
      maxActivations: 'أقصى عدد تفعيلات',
      generate: 'إنشاء ترخيص',
      revoke: 'إلغاء',
      confirmRevoke: 'هل أنت متأكد من إلغاء هذا الترخيص؟',
      licenseRevoked: 'تم إلغاء الترخيص بنجاح',
      deviceBound: 'مرتبط بالجهاز',
      credits: 'الأرصدة',
      remaining: 'المتبقي',
      started: 'بدأ',
      lastSeen: 'آخر ظهور',
      noLicenses: 'لم يتم إنشاء تراخيص بعد',
      noTrials: 'لم يتم العثور على جلسات تجربة',
      noSuspicious: 'لم يتم اكتشاف أنشطة مشبوهة',
      detected: 'تم الاكتشاف',
      action: 'الإجراء',
      error: 'خطأ',
      viewDetails: 'عرض التفاصيل',
      upgradeToPro: 'الترقية إلى الاحترافي',
      upgradeDescription: 'احصل على فواتير غير محدودة وميزات متقدمة ودعم ذو أولوية.',
    },

    branding: {
      title: 'إدارة العلامة التجارية',
      subtitle: 'تخصيص علامتك التجارية والألوان والشعارات',
      createNew: '+ إنشاء علامة تجارية',
      editBranding: 'تعديل ملف العلامة التجارية',
      createBranding: 'إنشاء ملف علامة تجارية',
      companyInfo: 'معلومات الشركة',
      companyName: 'اسم الشركة',
      companyNameAr: 'اسم الشركة (عربي)',
      tagline: 'الشعار',
      businessAddress: 'عنوان العمل',
      businessPhone: 'هاتف العمل',
      businessEmail: 'بريد العمل الإلكتروني',
      businessWebsite: 'موقع العمل الإلكتروني',
      taxId: 'الرقم الضريبي',
      logo: 'الشعار',
      colors: 'ألوان العلامة التجارية',
      primaryColor: 'اللون الأساسي',
      secondaryColor: 'اللون الثانوي',
      accentColor: 'لون التمييز',
      successColor: 'لون النجاح',
      warningColor: 'لون التحذير',
      errorColor: 'لون الخطأ',
      receiptSettings: 'إعدادات الإيصال',
      receiptHeader: 'نص رأس الإيصال',
      receiptFooter: 'نص تذييل الإيصال',
      active: 'نشط',
      activate: 'تفعيل',
      noBrandings: 'لا توجد ملفات علامة تجارية بعد. أنشئ واحداً للبدء!',
      brandingCreated: 'تم إنشاء ملف العلامة التجارية بنجاح!',
      brandingUpdated: 'تم تحديث ملف العلامة التجارية بنجاح!',
      brandingDeleted: 'تم حذف ملف العلامة التجارية!',
      brandingActivated: 'تم تفعيل العلامة التجارية!',
      confirmDelete: 'هل أنت متأكد من حذف ملف العلامة التجارية هذا؟',
      uploading: 'جاري الرفع...',
      dragToReplace: 'اسحب شعاراً جديداً للاستبدال، أو انقر للتصفح',
      dropHere: 'أسقط الشعار هنا',
      dragOrClick: 'اسحب وأسقط شعارك، أو انقر للتصفح',
      logoFormats: 'PNG، JPG، SVG حتى 10 ميجابايت',
      removeLogo: 'إزالة الشعار',
      themePresets: 'السمات المعدة مسبقاً',
      presetsSubtitle: 'اختر من سمات الألوان الجاهزة أو أنشئ سمتك الخاصة',
      selectBranding: 'حدد ملف علامة تجارية لتطبيق السمة:',
      chooseBranding: 'اختر ملف علامة تجارية...',
      builtin: 'مدمج',
      usedTimes: 'استخدم',
      times: 'مرات',
      applyTheme: 'تطبيق السمة',
      noPresets: 'لا توجد سمات معدة مسبقاً',
      selectBrandingFirst: 'يرجى تحديد ملف علامة تجارية أولاً',
      confirmApplyPreset: 'تطبيق هذه السمة على علامتك التجارية؟',
      themeApplied: 'تم تطبيق السمة بنجاح!',
      howItWorks: 'كيف يعمل',
      howStep1: 'حدد ملف علامة تجارية من القائمة المنسدلة أعلاه',
      howStep2: 'انقر على "تطبيق السمة" على أي سمة لتحديث الألوان',
      howStep3: 'سيتم تحديث ألوان علامتك التجارية فوراً',
      howStep4: 'يمكنك دائماً تخصيص الألوان بشكل أكبر في إدارة العلامة التجارية',
    },

    validation: {
      required: 'هذا الحقل مطلوب',
      invalid: 'إدخال غير صالح',
      tooShort: 'قصير جداً',
      tooLong: 'طويل جداً',
      mustBeNumber: 'يجب أن يكون رقماً',
      mustBePositive: 'يجب أن يكون موجباً',
      mustBeEmail: 'يجب أن يكون بريداً إلكترونياً صالحاً',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      insufficientStock: 'مخزون غير كافٍ',
      invalidCredentials: 'بيانات اعتماد غير صالحة',
      sessionExpired: 'انتهت صلاحية الجلسة',
      unauthorized: 'وصول غير مصرح به',
      forbidden: 'ممنوع',
      notFound: 'غير موجود',
      serverError: 'خطأ في الخادم',
    },

    success: {
      created: 'تم الإنشاء بنجاح',
      updated: 'تم التحديث بنجاح',
      deleted: 'تم الحذف بنجاح',
      saved: 'تم الحفظ بنجاح',
      processed: 'تمت المعالجة بنجاح',
      approved: 'تمت الموافقة بنجاح',
      rejected: 'تم الرفض بنجاح',
      completed: 'تم الإكمال بنجاح',
      cancelled: 'تم الإلغاء بنجاح',
      sessionStarted: 'تم بدء الجلسة بنجاح',
      sessionEnded: 'تم إنهاء الجلسة بنجاح',
      paymentProcessed: 'تمت معالجة الدفعة بنجاح',
      invoiceCreated: 'تم إنشاء الفاتورة بنجاح',
    },

    errors: {
      failed: 'فشلت العملية',
      createFailed: 'فشل الإنشاء',
      updateFailed: 'فشل التحديث',
      deleteFailed: 'فشل الحذف',
      loadFailed: 'فشل التحميل',
      processingFailed: 'فشلت المعالجة',
      networkError: 'خطأ في الشبكة',
      tryAgain: 'يرجى المحاولة مرة أخرى',
    },

    confirmations: {
      confirmDelete: 'هل أنت متأكد من حذف هذا؟',
      confirmArchive: 'هل أنت متأكد من أرشفة هذا؟',
      confirmRestore: 'هل أنت متأكد من استعادة هذا؟',
      confirmCancel: 'هل أنت متأكد من الإلغاء؟',
      confirmApprove: 'هل أنت متأكد من الموافقة؟',
      confirmReject: 'هل أنت متأكد من الرفض؟',
      areYouSure: 'هل أنت متأكد؟',
      cannotBeUndone: 'لا يمكن التراجع عن هذا الإجراء',
    },
  },
};

