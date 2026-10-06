/**
 * TripBnA — Food & Dining Provider Editing & Daily Availability System
 * Implements:
 * 1. Master Menu (permanent catalog) vs Daily Availability (today's stock)
 * 2. Routine provider edits (name, price, desc, portions, ingredients, prep time, photos, stock toggle) without admin approval
 * 3. Price change tracking and audit history logs
 * 4. Daily availability toggles (Available Today ON/OFF, Sold Out)
 * 5. Category preservation (never delete category structure, auto-hide from customers if 0 available items today)
 * 6. Brand new food items gated behind initial Admin approval (PENDING_ADMIN_APPROVAL -> APPROVED)
 * 7. Admin control dashboard (inspect providers, approve new items, override availability, suspend items/providers, view price history)
 */

(function() {
  'use strict';

  // Constants & Storage Keys
  const LS_KEY_MASTER_FOOD = 'tripbna_master_food_items_v5';
  const LS_KEY_FOOD_AVAILABILITY = 'tripbna_daily_food_availability_v5';
  const LS_KEY_FOOD_AUDIT_LOGS = 'tripbna_food_audit_logs_v5';

  const STANDARD_CATEGORIES = [
    "Local Food",
    "Vegetarian Food",
    "Meat",
    "Seafood",
    "Drinks",
    "Dessert",
    "Breakfast",
    "Snacks",
    "Fast Food",
    "International Food",
    "Other"
  ];

  // Initial Master Menu for Mama Africa Restaurant
  const MAMA_AFRICA_DEFAULT_MASTER = [
    // Local Food
    {
      id: "mama_pilau",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Local Food",
      name: "Pilau",
      description: "Authentic Tanzanian spiced rice simmered in rich beef broth, scented with whole cloves, cinnamon, cardamom, and caramelized onions.",
      price: 12000,
      currency: "TZS",
      portion: "Swahili Full Plate (400g)",
      ingredients: "Basmati rice, tender beef, cloves, cardamom, cumin, ginger, garlic, fried onions",
      prepTime: "20 mins",
      images: ["https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
      id: "mama_ugali",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Local Food",
      name: "Ugali",
      description: "Traditional white maize fufu, freshly made and served steaming hot alongside rich savory mchuzi gravy.",
      price: 5000,
      currency: "TZS",
      portion: "Classic hearty serving",
      ingredients: "Finely milled white maize flour, salted boiling water",
      prepTime: "15 mins",
      images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
      id: "mama_beef_stew",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Local Food",
      name: "Beef Stew",
      description: "Slow-simmered tender Arusha beef stew cooked with ripe vine tomatoes, carrots, sweet bell peppers, and fresh coriander.",
      price: 15000,
      currency: "TZS",
      portion: "Hearty 350g bowl",
      ingredients: "Grass-fed beef, vine tomatoes, carrots, bell peppers, garlic, ginger, coriander",
      prepTime: "25 mins",
      images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },

    // Vegetarian Food
    {
      id: "mama_veg_rice",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Vegetarian Food",
      name: "Vegetable Rice",
      description: "Steamed fragrant basmati rice tossed with garden sweet peas, diced carrots, yellow corn, and fresh herbs.",
      price: 10000,
      currency: "TZS",
      portion: "Large bowl (350g)",
      ingredients: "Basmati rice, sweet green peas, carrots, corn, mild curry spices, olive oil",
      prepTime: "20 mins",
      images: ["https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
      id: "mama_veg_curry",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Vegetarian Food",
      name: "Vegetable Curry",
      description: "Creamy Zanzibar style coconut curry loaded with farm chickpeas, pumpkin, spinach, and sweet potatoes with 2 chapatis.",
      price: 12000,
      currency: "TZS",
      portion: "Bowl with 2 warm chapatis",
      ingredients: "Chickpeas, butternut pumpkin, baby spinach, fresh coconut milk, turmeric, cumin",
      prepTime: "25 mins",
      images: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },

    // Drinks
    {
      id: "mama_fresh_juice",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Drinks",
      name: "Fresh Juice",
      description: "100% natural cold-pressed tropical juice blend: passion fruit, coastal mango, and tangy tamarind with crushed ice.",
      price: 5000,
      currency: "TZS",
      portion: "Chilled 450ml glass",
      ingredients: "Passion fruit pulp, mango nectar, tamarind juice, filtered ice",
      prepTime: "5 mins",
      images: ["https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
      id: "mama_soda",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Drinks",
      name: "Soda",
      description: "Chilled glass bottle soda: Coca-Cola, Fanta Orange, Sprite, or Stoney Tangawizi.",
      price: 2000,
      currency: "TZS",
      portion: "350ml glass bottle",
      ingredients: "Carbonated soda, chilled",
      prepTime: "Instant",
      images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
      id: "mama_water",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Drinks",
      name: "Water",
      description: "Factory-sealed Mount Kilimanjaro natural mineral spring water.",
      price: 1500,
      currency: "TZS",
      portion: "1.5L sealed bottle",
      ingredients: "Natural Tanzanian spring mineral water",
      prepTime: "Instant",
      images: ["https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },

    // Dessert
    {
      id: "mama_fruit_salad",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Dessert",
      name: "Fruit Salad",
      description: "Vibrant tropical fruit bowl with diced sweet papaya, pineapple, watermelon, and fresh lime-honey glaze.",
      price: 6000,
      currency: "TZS",
      portion: "Glass bowl (300g)",
      ingredients: "Papaya, pineapple, watermelon, mango, lime zest, organic honey",
      prepTime: "10 mins",
      images: ["https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
      id: "mama_ice_cream",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Dessert",
      name: "Ice Cream",
      description: "Artisanal dairy ice cream: Madagascar vanilla and dark cocoa with toasted coconut flakes.",
      price: 5000,
      currency: "TZS",
      portion: "2 generous scoops",
      ingredients: "Dairy cream, vanilla bean, cocoa, toasted coconut",
      prepTime: "Instant",
      images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },

    // Meat
    {
      id: "mama_mishkaki",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Meat",
      name: "Zanzibar Goat Mishkaki",
      description: "Flame-grilled skewers of tender goat marinated in Stone Town tamarind, garlic, ginger, and coastal spices.",
      price: 14000,
      currency: "TZS",
      portion: "4 skewers with tamarind dip",
      ingredients: "Goat meat, tamarind glaze, ginger, garlic, peppers, lime",
      prepTime: "20 mins",
      images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
      id: "mama_kuku_choma",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Meat",
      name: "Kuku Choma Charcoal Chicken",
      description: "Charcoal-grilled free-range half chicken glazed in aromatic Swahili herbs and lime, served with crispy fried potatoes.",
      price: 18000,
      currency: "TZS",
      portion: "Half chicken with kachumbari & chips",
      ingredients: "Farm kuku kienyeji chicken, Swahili spices, sea salt, lemon, hot pili pili",
      prepTime: "30 mins",
      images: ["https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },

    // Seafood
    {
      id: "mama_tilapia",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Seafood",
      name: "Lake Victoria Crispy Tilapia",
      description: "Whole fresh golden crispy fried tilapia fish, served with spicy kachumbari salsa, lemon wedges, and hot ugali.",
      price: 20000,
      currency: "TZS",
      portion: "Whole fish (approx 600g plate)",
      ingredients: "Fresh Lake Victoria tilapia, sea salt, garlic cloves, lemon juice, hot pili pili oil",
      prepTime: "25 mins",
      images: ["https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },

    // Breakfast
    {
      id: "mama_swahili_chai",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Breakfast",
      name: "Spiced Swahili Chai & Mandazi Combo",
      description: "Steaming pot of Tanzanian black tea brewed with crushed cardamom, ginger, and cinnamon, paired with 3 warm fluffy mandazi.",
      price: 4000,
      currency: "TZS",
      portion: "Pot of tea + 3 golden mandazi",
      ingredients: "Tanzanian highland tea, milk, cardamom pods, ginger, cinnamon, flour, coconut milk",
      prepTime: "10 mins",
      images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    },

    // Snacks
    {
      id: "mama_samosas",
      serviceId: 125,
      providerId: "prov_mama_africa",
      category: "Snacks",
      name: "Beef & Veggie Samosas (4 pcs)",
      description: "Four crispy, golden hand-folded pastry parcels packed with seasoned minced beef, green onions, and fresh coriander.",
      price: 5000,
      currency: "TZS",
      portion: "4 golden crispy pastries",
      ingredients: "Crisp pastry leaves, spiced beef mince, green onions, fresh coriander, lime wedges",
      prepTime: "12 mins",
      images: ["https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"],
      status: "AVAILABLE",
      approvalStatus: "APPROVED",
      createdAt: "2026-10-01T08:00:00.000Z"
    }
  ];

  // Initial Daily Availability for Mama Africa Restaurant (per requirement 4)
  // Pilau = available, Beef Stew = available, Fresh Juice = available, Fruit Salad = available
  // Ugali, Vegetable Rice, Vegetable Curry, Soda, Water, Ice Cream = unavailable today
  const MAMA_AFRICA_DEFAULT_AVAILABILITY = {
    "mama_pilau": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_beef_stew": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_ugali": { is_available: false, quantity_available: 0, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_veg_rice": { is_available: false, quantity_available: 0, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_veg_curry": { is_available: false, quantity_available: 0, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_fresh_juice": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_soda": { is_available: false, quantity_available: 0, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_water": { is_available: false, quantity_available: 0, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_fruit_salad": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_ice_cream": { is_available: false, quantity_available: 0, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_mishkaki": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_kuku_choma": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_tilapia": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_swahili_chai": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" },
    "mama_samosas": { is_available: true, quantity_available: null, is_sold_out: false, updated_by: "Mama Fatuma Loshilari", updated_at: "2026-10-06T06:00:00.000Z" }
  };

  // Helper Functions for Data Storage
  function getAllMasterFoodItems() {
    try {
      const stored = localStorage.getItem(LS_KEY_MASTER_FOOD);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    // Seed default
    const seeded = [...MAMA_AFRICA_DEFAULT_MASTER];
    saveAllMasterFoodItems(seeded);
    return seeded;
  }

  function saveAllMasterFoodItems(items) {
    try {
      localStorage.setItem(LS_KEY_MASTER_FOOD, JSON.stringify(items));
    } catch (e) {}
  }

  function getAllDailyAvailability() {
    try {
      const stored = localStorage.getItem(LS_KEY_FOOD_AVAILABILITY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    const seeded = { ...MAMA_AFRICA_DEFAULT_AVAILABILITY };
    saveAllDailyAvailability(seeded);
    return seeded;
  }

  function saveAllDailyAvailability(data) {
    try {
      localStorage.setItem(LS_KEY_FOOD_AVAILABILITY, JSON.stringify(data));
    } catch (e) {}
  }

  function getFoodAuditLogs() {
    try {
      const stored = localStorage.getItem(LS_KEY_FOOD_AUDIT_LOGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: "audit_init_1",
        foodItemId: "mama_pilau",
        foodItemName: "Pilau",
        serviceId: 125,
        action: "INITIAL_APPROVAL",
        previousPrice: null,
        newPrice: 12000,
        details: "Admin Jackson Loshilari approved Mama Africa Restaurant and master menu structure.",
        changedBy: "Jackson Loshilari (Admin)",
        timestamp: "2026-10-01T08:00:00.000Z"
      },
      {
        id: "audit_init_2",
        foodItemId: "mama_ugali",
        foodItemName: "Ugali",
        serviceId: 125,
        action: "AVAILABILITY_CHANGE",
        previousPrice: null,
        newPrice: null,
        details: "Provider set today's availability to Unavailable.",
        changedBy: "Mama Fatuma Loshilari (Provider)",
        timestamp: "2026-10-06T06:00:00.000Z"
      }
    ];
  }

  function addFoodAuditLog(entry) {
    const logs = getFoodAuditLogs();
    const newEntry = {
      id: "audit_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      ...entry
    };
    logs.unshift(newEntry);
    try {
      localStorage.setItem(LS_KEY_FOOD_AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
    } catch (e) {}
    return newEntry;
  }

  // Check if an item is available today
  function isFoodItemAvailableToday(item) {
    if (!item) return false;
    const isApproved = (item.approvalStatus === 'APPROVED' || item.status === 'Approved');
    if (!isApproved) return false;
    if (item.status === 'DISCONTINUED' || item.status === 'TEMPORARILY_HIDDEN') return false;

    const availMap = getAllDailyAvailability();
    const rec = availMap[item.id];
    if (rec) {
      if (rec.is_sold_out) return false;
      return rec.is_available === true;
    }
    // Fallback to item property if not in availability map
    return (item.availability !== 'unavailable' && item.isAvailable !== false);
  }

  function getDailyRecordForItem(foodItemId) {
    const availMap = getAllDailyAvailability();
    return availMap[foodItemId] || { is_available: true, quantity_available: null, is_sold_out: false };
  }

  function getActiveProviderActorName() {
    const sim = window.currentProviderSimulatedId;
    if (sim === 'prov_mama_africa') return 'Mama Fatuma Loshilari (Provider)';
    if (sim === 'admin') return 'Jackson Loshilari (Platform Admin)';
    if (window.currentUser && window.currentUser.displayName) return window.currentUser.displayName;
    return 'Authorized Food Provider';
  }

  // Toggle item availability today (Section 4 & 8: Simple toggle AVAILABLE TODAY: ON/OFF)
  function toggleDailyAvailability(foodItemId) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    const availMap = getAllDailyAvailability();
    const current = availMap[foodItemId] || { is_available: true, quantity_available: null, is_sold_out: false };
    const nextState = !current.is_available;

    availMap[foodItemId] = {
      ...current,
      is_available: nextState,
      is_sold_out: nextState ? false : current.is_sold_out,
      updated_by: getActiveProviderActorName(),
      updated_at: new Date().toISOString()
    };
    saveAllDailyAvailability(availMap);

    // Sync legacy menuData item if present
    syncLegacyMenuData(item.category, item.id, nextState);

    // Log routine availability change
    addFoodAuditLog({
      foodItemId: item.id,
      foodItemName: item.name,
      serviceId: item.serviceId,
      action: "AVAILABILITY_CHANGE",
      previousPrice: null,
      newPrice: null,
      details: `Today's availability toggled to ${nextState ? '🟢 AVAILABLE TODAY' : '⚪ UNAVAILABLE TODAY'}.`,
      changedBy: getActiveProviderActorName()
    });

    if (typeof showToast === 'function') {
      showToast(`${item.name} is now ${nextState ? '🟢 Available Today' : '⚪ Unavailable Today'}`);
    }

    // Refresh provider dashboard and customer views
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
    if (typeof renderFoodSection === 'function') renderFoodSection();
  }

  // Mark Sold Out Today
  function setDailySoldOut(foodItemId) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    const availMap = getAllDailyAvailability();
    const current = availMap[foodItemId] || { is_available: true, quantity_available: null, is_sold_out: false };
    const nextSoldOut = !current.is_sold_out;

    availMap[foodItemId] = {
      ...current,
      is_sold_out: nextSoldOut,
      is_available: nextSoldOut ? false : current.is_available,
      updated_by: getActiveProviderActorName(),
      updated_at: new Date().toISOString()
    };
    saveAllDailyAvailability(availMap);

    syncLegacyMenuData(item.category, item.id, !nextSoldOut);

    addFoodAuditLog({
      foodItemId: item.id,
      foodItemName: item.name,
      serviceId: item.serviceId,
      action: "AVAILABILITY_CHANGE",
      previousPrice: null,
      newPrice: null,
      details: nextSoldOut ? `Marked SOLD OUT for today.` : `Sold-out status cleared; restored to daily stock.`,
      changedBy: getActiveProviderActorName()
    });

    if (typeof showToast === 'function') {
      showToast(`${item.name} ${nextSoldOut ? 'marked Sold Out today' : 'restored from Sold Out'}`);
    }

    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
  }

  // Bulk category toggle
  function toggleCategoryDailyAvailability(categoryName, targetAvailable) {
    const allItems = getAllMasterFoodItems();
    const availMap = getAllDailyAvailability();
    let updatedCount = 0;

    allItems.filter(i => i.category === categoryName).forEach(item => {
      const cur = availMap[item.id] || { is_available: true };
      availMap[item.id] = {
        ...cur,
        is_available: targetAvailable,
        is_sold_out: targetAvailable ? false : cur.is_sold_out,
        updated_by: getActiveProviderActorName(),
        updated_at: new Date().toISOString()
      };
      syncLegacyMenuData(item.category, item.id, targetAvailable);
      updatedCount++;
    });

    saveAllDailyAvailability(availMap);

    addFoodAuditLog({
      foodItemId: "bulk_" + categoryName,
      foodItemName: `Category: ${categoryName}`,
      serviceId: 125,
      action: "AVAILABILITY_CHANGE",
      previousPrice: null,
      newPrice: null,
      details: `Bulk toggle: All ${updatedCount} items in "${categoryName}" marked ${targetAvailable ? 'Available Today' : 'Unavailable Today'}.`,
      changedBy: getActiveProviderActorName()
    });

    if (typeof showToast === 'function') {
      showToast(`All items in "${categoryName}" set to ${targetAvailable ? 'Available' : 'Unavailable'}`);
    }

    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
  }

  // Toggle item hidden status
  function toggleFoodItemHidden(foodItemId) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    const nextStatus = (item.status === 'TEMPORARILY_HIDDEN') ? 'AVAILABLE' : 'TEMPORARILY_HIDDEN';
    item.status = nextStatus;
    saveAllMasterFoodItems(allItems);

    addFoodAuditLog({
      foodItemId: item.id,
      foodItemName: item.name,
      serviceId: item.serviceId,
      action: "DISH_EDIT",
      previousPrice: null,
      newPrice: null,
      details: nextStatus === 'TEMPORARILY_HIDDEN' ? `Item temporarily hidden from menu.` : `Item restored from hidden.`,
      changedBy: getActiveProviderActorName()
    });

    if (typeof showToast === 'function') {
      showToast(`Item "${item.name}" ${nextStatus === 'TEMPORARILY_HIDDEN' ? 'temporarily hidden' : 'restored'}`);
    }

    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
  }

  // Discontinue / Restore item (Section 10)
  function toggleFoodItemDiscontinued(foodItemId) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    const isDisc = item.status === 'DISCONTINUED';
    const nextStatus = isDisc ? 'AVAILABLE' : 'DISCONTINUED';

    if (!isDisc) {
      if (!confirm(`Mark "${item.name}" as DISCONTINUED? It will be removed from customer view but permanently preserved in the database for historical reporting.`)) {
        return;
      }
    }

    item.status = nextStatus;
    saveAllMasterFoodItems(allItems);

    addFoodAuditLog({
      foodItemId: item.id,
      foodItemName: item.name,
      serviceId: item.serviceId,
      action: "DISH_EDIT",
      previousPrice: null,
      newPrice: null,
      details: nextStatus === 'DISCONTINUED' ? `Item marked DISCONTINUED (preserved in database).` : `Discontinued item restored to active Master Menu.`,
      changedBy: getActiveProviderActorName()
    });

    if (typeof showToast === 'function') {
      showToast(`"${item.name}" ${nextStatus === 'DISCONTINUED' ? 'marked Discontinued' : 'restored to Master Menu'}`);
    }

    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
  }

  function syncLegacyMenuData(cat, itemId, isAvail) {
    if (typeof window.menuData !== 'undefined' && window.menuData && window.menuData[cat]) {
      const found = window.menuData[cat].find(i => String(i.id) === String(itemId));
      if (found) {
        found.availability = isAvail ? 'available' : 'unavailable';
        found.isAvailable = isAvail;
      }
    }
  }

  // -------------------------------------------------------------
  // PROVIDER DASHBOARD: TABLE-BASED RENDER (Matching Section 8)
  // -------------------------------------------------------------
  function renderProviderFoodCategories() {
    const container = document.getElementById("categoriesContainer");
    if (!container) return;
    container.innerHTML = "";

    const allMasterItems = getAllMasterFoodItems();
    const availMap = getAllDailyAvailability();

    // Summary statistics
    let totalItems = 0;
    let availableTodayCount = 0;
    let unavailableTodayCount = 0;
    let pendingApprovalCount = 0;

    allMasterItems.forEach(item => {
      if (item.status === 'DISCONTINUED') return;
      totalItems++;
      if (item.approvalStatus === 'PENDING_ADMIN_APPROVAL') {
        pendingApprovalCount++;
      } else {
        const isAvail = isFoodItemAvailableToday(item);
        if (isAvail) availableTodayCount++;
        else unavailableTodayCount++;
      }
    });

    // Populate stat counters
    const statsBar = document.getElementById("menuStatsBar");
    if (statsBar) {
      statsBar.innerHTML = `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:10px 14px; flex:1; min-width:130px;">
          <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Master Menu</div>
          <div style="font-size:20px; font-weight:800; color:#0f172a; margin-top:2px;">${totalItems} Items</div>
        </div>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:10px 14px; flex:1; min-width:130px;">
          <div style="font-size:11px; font-weight:700; color:#15803d; text-transform:uppercase;">Available Today</div>
          <div style="font-size:20px; font-weight:800; color:#166534; margin-top:2px;">${availableTodayCount} Live</div>
        </div>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:10px 14px; flex:1; min-width:130px;">
          <div style="font-size:11px; font-weight:700; color:#b91c1c; text-transform:uppercase;">Unavailable Today</div>
          <div style="font-size:20px; font-weight:800; color:#991b1b; margin-top:2px;">${unavailableTodayCount} Off</div>
        </div>
        <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:10px 14px; flex:1; min-width:130px;">
          <div style="font-size:11px; font-weight:700; color:#b45309; text-transform:uppercase;">Pending Review</div>
          <div style="font-size:20px; font-weight:800; color:#92400e; margin-top:2px;">${pendingApprovalCount} Items</div>
        </div>
      `;
    }

    // Category filter pills
    const pillsContainer = document.getElementById("menuCategoryPills");
    if (pillsContainer) {
      const activeFilter = window.activeCategoryFilter || "all";
      let pillHtml = `
        <button type="button" class="hub-chip ${activeFilter === 'all' ? 'active' : ''}" onclick="filterProviderMenuCategory('all')" style="padding:6px 12px; font-size:12px; font-weight:700; border-radius:8px; cursor:pointer; ${activeFilter === 'all' ? 'background:#047857; color:#fff; border:none;' : 'background:#fff; color:#334155; border:1px solid #cbd5e1;'}">
          All Categories (${totalItems})
        </button>
      `;
      STANDARD_CATEGORIES.forEach(cat => {
        const catCount = allMasterItems.filter(i => i.category === cat && i.status !== 'DISCONTINUED').length;
        const isActive = activeFilter === cat;
        pillHtml += `
          <button type="button" class="hub-chip ${isActive ? 'active' : ''}" onclick="filterProviderMenuCategory('${cat}')" style="padding:6px 12px; font-size:12px; font-weight:700; border-radius:8px; cursor:pointer; ${isActive ? 'background:#047857; color:#fff; border:none;' : 'background:#fff; color:#334155; border:1px solid #cbd5e1;'}">
            ${escapeHTML(cat)} (${catCount})
          </button>
        `;
      });
      pillsContainer.innerHTML = pillHtml;
    }

    const activeFilter = window.activeCategoryFilter || "all";
    const categoriesToRender = (activeFilter === "all")
      ? STANDARD_CATEGORIES
      : STANDARD_CATEGORIES.filter(c => c === activeFilter);

    // Render category cards
    categoriesToRender.forEach(cat => {
      const itemsInCat = allMasterItems.filter(i => i.category === cat);
      const activeItemsInCat = itemsInCat.filter(i => i.status !== 'DISCONTINUED');
      const availCount = activeItemsInCat.filter(i => isFoodItemAvailableToday(i)).length;

      const catCard = document.createElement("div");
      catCard.className = "card";
      catCard.style.cssText = "padding:18px; margin-bottom:18px; border:1px solid #e2e8f0; border-radius:14px; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.04);";

      const isHiddenNotice = (availCount === 0 && activeItemsInCat.length > 0)
        ? `<span class="badge" style="background:#fffbeb; color:#b45309; border:1px solid #fde68a; font-size:11px; padding:3px 8px; border-radius:6px; font-weight:700;">⚪ 0 available today (Category temporarily hidden from customers for today)</span>`
        : `<span class="badge" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; font-size:11px; padding:3px 8px; border-radius:6px; font-weight:700;">🟢 ${availCount} of ${activeItemsInCat.length} available today</span>`;

      catCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <h3 style="margin:0; font-size:17px; color:#0f172a; font-weight:800;">🍽️ ${escapeHTML(cat)}</h3>
              ${isHiddenNotice}
            </div>
            <div style="font-size:12px; color:#64748b; margin-top:2px;">Category structure permanently preserved in Master Menu.</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <button type="button" class="ghost" style="padding:5px 10px; font-size:11.5px; font-weight:700; color:#15803d; border:1px solid #bbf7d0; background:#f0fdf4; border-radius:6px; cursor:pointer;" onclick="toggleCategoryDailyAvailability('${cat}', true)">
              ✓ All Available
            </button>
            <button type="button" class="ghost" style="padding:5px 10px; font-size:11.5px; font-weight:700; color:#64748b; border:1px solid #cbd5e1; background:#f8fafc; border-radius:6px; cursor:pointer;" onclick="toggleCategoryDailyAvailability('${cat}', false)">
              ○ All Unavailable
            </button>
            <button type="button" class="ghost" style="padding:5px 10px; font-size:11.5px; font-weight:700; color:#0284c7; border:1px solid #bae6fd; background:#f0f9ff; border-radius:6px; cursor:pointer;" onclick="openAddDishModal('${cat}')">
              ➕ Add ${escapeHTML(cat)} Dish
            </button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="table" style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:1px solid #cbd5e1; text-align:left;">
                <th style="padding:10px 12px; font-weight:800; color:#334155;">Food Item</th>
                <th style="padding:10px 12px; font-weight:800; color:#334155;">Price</th>
                <th style="padding:10px 12px; font-weight:800; color:#334155; text-align:center;">Today's Availability</th>
                <th style="padding:10px 12px; font-weight:800; color:#334155;">Approval Status</th>
                <th style="padding:10px 12px; font-weight:800; color:#334155; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="cat_table_body_${cat.replace(/[^a-zA-Z0-9]/g, '_')}"></tbody>
          </table>
        </div>
      `;

      const tbody = catCard.querySelector(`#cat_table_body_${cat.replace(/[^a-zA-Z0-9]/g, '_')}`);

      if (itemsInCat.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center; padding:24px; color:#94a3b8; font-size:13px; background:#f8fafc;">
              No dishes in "${escapeHTML(cat)}" yet. Click <strong>➕ Add ${escapeHTML(cat)} Dish</strong> to add one.
            </td>
          </tr>
        `;
      } else {
        itemsInCat.forEach(item => {
          const isDisc = item.status === 'DISCONTINUED';
          const isHidden = item.status === 'TEMPORARILY_HIDDEN';
          const isPending = item.approvalStatus === 'PENDING_ADMIN_APPROVAL';
          const isApproved = (item.approvalStatus === 'APPROVED' || item.status === 'Approved');

          const daily = availMap[item.id] || { is_available: true, is_sold_out: false };
          const isAvailToday = isApproved && !isDisc && !isHidden && daily.is_available && !daily.is_sold_out;

          const primaryImg = (Array.isArray(item.images) && item.images[0]) ? item.images[0] : (item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80");

          // Price label
          const priceStr = (item.currency === 'TZS')
            ? `TZS ${(Number(item.price) || 0).toLocaleString()}`
            : `$${Number(item.price || 0).toFixed(2)}`;

          // Today's toggle button
          let toggleBtnHtml = '';
          if (isPending) {
            toggleBtnHtml = `<span class="badge" style="background:#fef3c7; color:#92400e; font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700;">⏳ Awaiting Admin Approval</span>`;
          } else if (isDisc) {
            toggleBtnHtml = `<span class="badge" style="background:#f1f5f9; color:#64748b; font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700;">Discontinued</span>`;
          } else {
            const btnBg = isAvailToday ? '#16a34a' : '#94a3b8';
            const btnLabel = isAvailToday ? '🟢 AVAILABLE TODAY: ON' : '⚪ AVAILABLE TODAY: OFF';
            toggleBtnHtml = `
              <div style="display:flex; align-items:center; justify-content:center; gap:6px; flex-wrap:wrap;">
                <button type="button" onclick="toggleDailyAvailability('${item.id}')" style="background:${btnBg}; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; min-width:170px;" title="Click to toggle today's customer availability">
                  ${btnLabel}
                </button>
                <button type="button" onclick="setDailySoldOut('${item.id}')" style="background:${daily.is_sold_out ? '#dc2626' : '#f8fafc'}; color:${daily.is_sold_out ? '#fff' : '#64748b'}; border:1px solid #cbd5e1; padding:6px 8px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;" title="Mark Sold Out Today">
                  ${daily.is_sold_out ? '⛔ Sold Out' : 'Sold Out?'}
                </button>
              </div>
            `;
          }

          // Approval badge
          let statusBadge = '';
          if (isPending) {
            statusBadge = `<span class="chip" style="font-size:11px; font-weight:700; background:#fef3c7; color:#92400e; border:1px solid #fde68a;">⏳ Pending Admin Approval</span>`;
          } else if (item.approvalStatus === 'REJECTED') {
            statusBadge = `<span class="chip" style="font-size:11px; font-weight:700; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">❌ Rejected</span>`;
          } else if (item.approvalStatus === 'SUSPENDED') {
            statusBadge = `<span class="chip" style="font-size:11px; font-weight:700; background:#ffedd5; color:#c2410c; border:1px solid #fed7aa;">⏸️ Suspended by Admin</span>`;
          } else if (isDisc) {
            statusBadge = `<span class="chip" style="font-size:11px; font-weight:700; background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1;">📦 Discontinued</span>`;
          } else if (isHidden) {
            statusBadge = `<span class="chip" style="font-size:11px; font-weight:700; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">👁️ Temporarily Hidden</span>`;
          } else {
            statusBadge = `<span class="chip" style="font-size:11px; font-weight:700; background:#dcfce7; color:#15803d; border:1px solid #86efac;">✓ Approved &amp; Active</span>`;
          }

          const tr = document.createElement("tr");
          tr.style.cssText = `border-bottom:1px solid #f1f5f9; ${isDisc ? 'opacity:0.6; background:#fafafa;' : ''}`;
          tr.innerHTML = `
            <td style="padding:12px; vertical-align:middle;">
              <div style="display:flex; align-items:center; gap:10px;">
                <img src="${primaryImg}" style="width:48px; height:48px; border-radius:8px; object-fit:cover; border:1px solid #cbd5e1; flex-shrink:0;">
                <div>
                  <div style="font-weight:800; font-size:14px; color:#0f172a;">${escapeHTML(item.name)}</div>
                  <div style="font-size:11.5px; color:#64748b;">${escapeHTML(item.portion || '')} ${item.prepTime ? `• ⏱️ ${escapeHTML(item.prepTime)}` : ''}</div>
                  ${item.ingredients ? `<div style="font-size:11px; color:#0284c7; margin-top:2px;">🌿 ${escapeHTML(item.ingredients)}</div>` : ''}
                </div>
              </div>
            </td>
            <td style="padding:12px; vertical-align:middle; white-space:nowrap;">
              <strong style="color:#15803d; font-size:14px;">${priceStr}</strong>
            </td>
            <td style="padding:12px; vertical-align:middle; text-align:center;">
              ${toggleBtnHtml}
            </td>
            <td style="padding:12px; vertical-align:middle;">
              ${statusBadge}
            </td>
            <td style="padding:12px; vertical-align:middle; text-align:right; white-space:nowrap;">
              <div style="display:flex; gap:4px; justify-content:flex-end;">
                <button type="button" class="ghost" style="padding:5px 8px; font-size:11px; font-weight:700; color:#0369a1; border:1px solid #bae6fd; background:#f0f9ff; border-radius:6px; cursor:pointer;" onclick="openEditDishModalById('${item.id}')" title="Routine Edit (Instant, no admin re-approval)">
                  ✏️ Edit
                </button>
                <button type="button" class="ghost" style="padding:5px 8px; font-size:11px; font-weight:700; color:#334155; border:1px solid #cbd5e1; background:#f8fafc; border-radius:6px; cursor:pointer;" onclick="openAuditHistoryModalForDish('${item.id}')" title="View Price and Edit History">
                  📋 History
                </button>
                <button type="button" class="ghost" style="padding:5px 8px; font-size:11px; font-weight:700; color:#475569; border:1px solid #cbd5e1; background:#fff; border-radius:6px; cursor:pointer;" onclick="toggleFoodItemHidden('${item.id}')" title="Temporarily hide/restore from menu">
                  ${isHidden ? '👁️ Restore' : '👁️ Hide'}
                </button>
                <button type="button" class="ghost" style="padding:5px 8px; font-size:11px; font-weight:700; color:#dc2626; border:1px solid #fecaca; background:#fef2f2; border-radius:6px; cursor:pointer;" onclick="toggleFoodItemDiscontinued('${item.id}')" title="Permanently stop selling (Kept in database)">
                  ${isDisc ? '📦 Restore' : '📦 Discontinue'}
                </button>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      container.appendChild(catCard);
    });
  }

  // -------------------------------------------------------------
  // DISH ADD & EDIT MODAL HANDLERS
  // -------------------------------------------------------------
  let currentEditingDishId = null;

  function openAddDishModal(preSelectedCat) {
    const modal = document.getElementById("foodDishEditorModal");
    if (!modal) return;

    currentEditingDishId = null;
    document.getElementById("dishEditorModalTitle").textContent = "🍽️ Add New Food / Menu Item";
    document.getElementById("dishEditorEditIndex").value = "-1";
    document.getElementById("dishEditorTargetCategory").value = "";

    // Clear form fields
    const nameEl = document.getElementById("dishEditorName"); if (nameEl) nameEl.value = "";
    const priceEl = document.getElementById("dishEditorPrice"); if (priceEl) priceEl.value = "";
    const currEl = document.getElementById("dishEditorCurrency"); if (currEl) currEl.value = "TZS";
    const portionEl = document.getElementById("dishEditorPortion"); if (portionEl) portionEl.value = "";
    const ingEl = document.getElementById("dishEditorIngredients"); if (ingEl) ingEl.value = "";
    const prepEl = document.getElementById("dishEditorPrepTime"); if (prepEl) prepEl.value = "20 mins";
    const availEl = document.getElementById("dishEditorAvailability"); if (availEl) availEl.value = "available";
    const qtyEl = document.getElementById("dishEditorQuantity"); if (qtyEl) qtyEl.value = "";
    const statusEl = document.getElementById("dishEditorStatus"); if (statusEl) statusEl.value = "AVAILABLE";
    const descEl = document.getElementById("dishEditorDesc"); if (descEl) descEl.value = "";

    // Populate category dropdown
    const catSelect = document.getElementById("dishEditorCategory");
    if (catSelect) {
      catSelect.innerHTML = STANDARD_CATEGORIES.map(c => 
        `<option value="${c}" ${c === preSelectedCat ? 'selected' : ''}>${c}</option>`
      ).join('');
    }

    // Set notice for new dish
    const noticeEl = document.getElementById("dishEditorApprovalNotice");
    if (noticeEl) {
      noticeEl.innerHTML = `ℹ️ <strong>Security & Quality Governance:</strong> Brand new food items will be submitted with status <strong>⏳ PENDING_ADMIN_APPROVAL</strong>. Once reviewed and approved by Platform Admin Jackson Loshilari, you can manage routine daily availability directly without further approval.`;
      noticeEl.style.background = "#fffbeb";
      noticeEl.style.borderColor = "#fde68a";
      noticeEl.style.color = "#92400e";
    }

    const historyBtnWrap = document.getElementById("dishEditorAuditHistoryBtnWrap");
    if (historyBtnWrap) historyBtnWrap.style.display = "none";

    renderDishThumbnails([]);
    modal.style.display = "flex";
  }

  function openEditDishModalById(foodItemId) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    currentEditingDishId = item.id;
    const modal = document.getElementById("foodDishEditorModal");
    if (!modal) return;

    document.getElementById("dishEditorModalTitle").textContent = `✏️ Routine Edit: ${item.name}`;
    document.getElementById("dishEditorEditIndex").value = String(item.id);
    document.getElementById("dishEditorTargetCategory").value = item.category || "";

    const nameEl = document.getElementById("dishEditorName"); if (nameEl) nameEl.value = item.name || "";
    const priceEl = document.getElementById("dishEditorPrice"); if (priceEl) priceEl.value = item.price !== undefined ? item.price : "";
    const currEl = document.getElementById("dishEditorCurrency"); if (currEl) currEl.value = item.currency || "TZS";
    const portionEl = document.getElementById("dishEditorPortion"); if (portionEl) portionEl.value = item.portion || "";
    const ingEl = document.getElementById("dishEditorIngredients"); if (ingEl) ingEl.value = item.ingredients || "";
    const prepEl = document.getElementById("dishEditorPrepTime"); if (prepEl) prepEl.value = item.prepTime || "";

    const daily = getDailyRecordForItem(item.id);
    const availEl = document.getElementById("dishEditorAvailability"); 
    if (availEl) {
      if (daily.is_sold_out) availEl.value = "sold_out";
      else availEl.value = daily.is_available ? "available" : "unavailable";
    }

    const qtyEl = document.getElementById("dishEditorQuantity"); 
    if (qtyEl) qtyEl.value = daily.quantity_available !== null && daily.quantity_available !== undefined ? daily.quantity_available : "";

    const statusEl = document.getElementById("dishEditorStatus"); 
    if (statusEl) statusEl.value = item.status || "AVAILABLE";

    const descEl = document.getElementById("dishEditorDesc"); 
    if (descEl) descEl.value = item.description || item.desc || "";

    const catSelect = document.getElementById("dishEditorCategory");
    if (catSelect) {
      catSelect.innerHTML = STANDARD_CATEGORIES.map(c => 
        `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`
      ).join('');
    }

    // Set notice for routine edit
    const noticeEl = document.getElementById("dishEditorApprovalNotice");
    if (noticeEl) {
      noticeEl.innerHTML = `✓ <strong>Routine Edit Policy:</strong> Edits to this approved food item (name, description, price, portion, ingredients, prep time, photos, stock availability) take effect <strong>IMMEDIATELY</strong> without needing Admin approval. All updates are logged in the audit ledger.`;
      noticeEl.style.background = "#f0fdf4";
      noticeEl.style.borderColor = "#bbf7d0";
      noticeEl.style.color = "#166534";
    }

    const historyBtnWrap = document.getElementById("dishEditorAuditHistoryBtnWrap");
    if (historyBtnWrap) historyBtnWrap.style.display = "block";

    renderDishThumbnails(Array.isArray(item.images) ? item.images : [item.image || ""]);
    modal.style.display = "flex";
  }

  // Legacy bridge
  function openEditDishModal(cat, idx) {
    if (typeof cat === 'string' && idx !== undefined) {
      const allItems = getAllMasterFoodItems();
      const inCat = allItems.filter(i => i.category === cat);
      if (inCat[idx]) {
        openEditDishModalById(inCat[idx].id);
        return;
      }
    }
    openAddDishModal(cat || 'Local Food');
  }

  function renderDishThumbnails(images) {
    const thumbContainer = document.getElementById("dishEditorThumbnails");
    if (!thumbContainer) return;
    thumbContainer.innerHTML = "";

    const validImages = images.filter(Boolean);
    window._currentDishImages = [...validImages];

    if (validImages.length === 0) {
      thumbContainer.innerHTML = `<span id="dishEditorNoImagesPlaceholder" style="font-size:12px; color:#94a3b8;">No photos added yet. Upload files or paste URLs above.</span>`;
      return;
    }

    validImages.forEach((img, idx) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:relative; width:52px; height:52px;";
      wrap.innerHTML = `
        <img src="${img}" style="width:52px; height:52px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1;">
        <button type="button" onclick="removeDishThumbnail(${idx})" style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:#fff; border:none; width:18px; height:18px; border-radius:50%; font-size:10px; cursor:pointer; font-weight:800; display:flex; align-items:center; justify-content:center;">✕</button>
      `;
      thumbContainer.appendChild(wrap);
    });
  }

  function removeDishThumbnail(idx) {
    if (window._currentDishImages) {
      window._currentDishImages.splice(idx, 1);
      renderDishThumbnails(window._currentDishImages);
    }
  }
  window.removeDishThumbnail = removeDishThumbnail;

  function addDishImageUrl() {
    const input = document.getElementById("dishEditorImageUrlInput");
    const url = (input?.value || "").trim();
    if (!url) return;
    if (!window._currentDishImages) window._currentDishImages = [];
    window._currentDishImages.push(url);
    renderDishThumbnails(window._currentDishImages);
    if (input) input.value = "";
  }
  window.addDishImageUrl = addDishImageUrl;

  function handleDishImageFiles(files) {
    if (!files || !files.length) return;
    if (!window._currentDishImages) window._currentDishImages = [];
    Array.from(files).forEach(f => {
      const reader = new FileReader();
      reader.onload = e => {
        window._currentDishImages.push(e.target.result);
        renderDishThumbnails(window._currentDishImages);
      };
      reader.readAsDataURL(f);
    });
  }
  window.handleDishImageFiles = handleDishImageFiles;

  function closeDishEditorModal() {
    const modal = document.getElementById("foodDishEditorModal");
    if (modal) modal.style.display = "none";
    currentEditingDishId = null;
  }
  window.closeDishEditorModal = closeDishEditorModal;
  window.closeFoodDishModal = closeDishEditorModal;

  // Save Dish From Modal
  function saveDishFromModal() {
    const name = (document.getElementById("dishEditorName")?.value || "").trim();
    const cat = document.getElementById("dishEditorCategory")?.value;
    const price = parseFloat(document.getElementById("dishEditorPrice")?.value);
    const currency = document.getElementById("dishEditorCurrency")?.value || "TZS";
    const portion = (document.getElementById("dishEditorPortion")?.value || "").trim();
    const ingredients = (document.getElementById("dishEditorIngredients")?.value || "").trim();
    const prepTime = (document.getElementById("dishEditorPrepTime")?.value || "").trim();
    const availabilityVal = document.getElementById("dishEditorAvailability")?.value || "available";
    const qtyVal = document.getElementById("dishEditorQuantity")?.value;
    const statusVal = document.getElementById("dishEditorStatus")?.value || "AVAILABLE";
    const desc = (document.getElementById("dishEditorDesc")?.value || "").trim();

    if (!name) return alert("Please enter the food item name.");
    if (isNaN(price) || price < 0) return alert("Please enter a valid price.");
    if (!cat) return alert("Please select a food category.");

    const images = (window._currentDishImages && window._currentDishImages.length)
      ? window._currentDishImages
      : ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"];

    const allItems = getAllMasterFoodItems();
    const availMap = getAllDailyAvailability();
    const isSuperAdmin = (window.currentUser && typeof window.isAdmin === 'function' && window.isAdmin(window.currentUser)) || window.currentProviderSimulatedId === 'admin';

    const isAvailableToday = availabilityVal === "available";
    const isSoldOut = availabilityVal === "sold_out";
    const qty = (qtyVal !== "" && !isNaN(parseInt(qtyVal, 10))) ? parseInt(qtyVal, 10) : null;

    if (currentEditingDishId) {
      // Routine Edit of Existing Item
      const existing = allItems.find(i => String(i.id) === String(currentEditingDishId));
      if (!existing) return;

      const previousPrice = existing.price;
      const isPriceChanged = previousPrice !== price;

      existing.name = name;
      existing.category = cat;
      existing.price = price;
      existing.currency = currency;
      existing.portion = portion;
      existing.ingredients = ingredients;
      existing.prepTime = prepTime;
      existing.description = desc;
      existing.images = images;
      existing.status = statusVal;
      existing.updatedAt = new Date().toISOString();

      // Routine edit: preserve approval status
      if (isSuperAdmin) {
        existing.approvalStatus = "APPROVED";
      }

      // Update daily availability
      availMap[existing.id] = {
        is_available: isAvailableToday,
        quantity_available: qty,
        is_sold_out: isSoldOut,
        updated_by: getActiveProviderActorName(),
        updated_at: new Date().toISOString()
      };

      saveAllMasterFoodItems(allItems);
      saveAllDailyAvailability(availMap);

      // Audit log
      if (isPriceChanged) {
        addFoodAuditLog({
          foodItemId: existing.id,
          foodItemName: existing.name,
          serviceId: existing.serviceId,
          action: "PRICE_CHANGE",
          previousPrice: previousPrice,
          newPrice: price,
          details: `Price updated from ${currency} ${previousPrice.toLocaleString()} to ${currency} ${price.toLocaleString()}.`,
          changedBy: getActiveProviderActorName()
        });
      }

      addFoodAuditLog({
        foodItemId: existing.id,
        foodItemName: existing.name,
        serviceId: existing.serviceId,
        action: "DISH_EDIT",
        previousPrice: isPriceChanged ? previousPrice : null,
        newPrice: isPriceChanged ? price : null,
        details: `Routine edit saved: Description, portion (${portion || 'N/A'}), ingredients, photos.`,
        changedBy: getActiveProviderActorName()
      });

      if (typeof showToast === 'function') {
        showToast(`✓ Updated "${name}" successfully (Routine Edit: Instant Live)`);
      }
    } else {
      // Brand New Food Item
      const newId = "dish_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
      const approvalStatus = isSuperAdmin ? "APPROVED" : "PENDING_ADMIN_APPROVAL";

      const newItem = {
        id: newId,
        serviceId: 125,
        providerId: "prov_mama_africa",
        category: cat,
        name: name,
        description: desc,
        price: price,
        currency: currency,
        portion: portion,
        ingredients: ingredients,
        prepTime: prepTime,
        images: images,
        status: statusVal,
        approvalStatus: approvalStatus,
        createdAt: new Date().toISOString()
      };

      allItems.push(newItem);

      availMap[newId] = {
        is_available: isAvailableToday,
        quantity_available: qty,
        is_sold_out: isSoldOut,
        updated_by: getActiveProviderActorName(),
        updated_at: new Date().toISOString()
      };

      saveAllMasterFoodItems(allItems);
      saveAllDailyAvailability(availMap);

      addFoodAuditLog({
        foodItemId: newId,
        foodItemName: name,
        serviceId: 125,
        action: "NEW_DISH_SUBMITTED",
        previousPrice: null,
        newPrice: price,
        details: isSuperAdmin
          ? `Admin created and approved new dish "${name}" in ${cat}.`
          : `New food item submitted for Jackson Loshilari (Admin) approval. Initial status: PENDING_ADMIN_APPROVAL.`,
        changedBy: getActiveProviderActorName()
      });

      if (typeof showToast === 'function') {
        if (isSuperAdmin) {
          showToast(`✅ Added & Approved "${name}"!`);
        } else {
          showToast(`🚀 "${name}" submitted for Admin review. Once approved, you can manage daily stock directly.`);
        }
      }
    }

    closeDishEditorModal();
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
    if (typeof renderFoodSection === 'function') renderFoodSection();
  }
  window.saveDishFromModal = saveDishFromModal;

  // -------------------------------------------------------------
  // AUDIT & PRICE HISTORY MODAL HANDLERS (Section 3, 11 & 12)
  // -------------------------------------------------------------
  function openAuditHistoryModalForDish(foodItemId) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    const modal = document.getElementById("foodAuditHistoryModal");
    if (!modal) return;

    const titleEl = document.getElementById("auditHistoryModalTitle");
    if (titleEl) titleEl.textContent = `📋 Audit & Price History: ${item.name}`;

    const subEl = document.getElementById("auditHistoryModalSubtitle");
    if (subEl) subEl.textContent = `Full ledger for "${item.name}" (${item.category} • Current Price: ${item.currency || 'TZS'} ${item.price.toLocaleString()})`;

    const allLogs = getFoodAuditLogs();
    const itemLogs = allLogs.filter(l => String(l.foodItemId) === String(item.id));
    const priceLogs = itemLogs.filter(l => l.action === 'PRICE_CHANGE' || l.action === 'INITIAL_APPROVAL');

    // Render price change history
    const priceListContainer = document.getElementById("auditHistoryPriceList");
    if (priceListContainer) {
      if (priceLogs.length === 0) {
        priceListContainer.innerHTML = `<div style="padding:14px; font-size:12.5px; color:#64748b; background:#f8fafc;">No previous price changes recorded. Current price: ${item.currency || 'TZS'} ${item.price.toLocaleString()}</div>`;
      } else {
        priceListContainer.innerHTML = priceLogs.map(l => `
          <div style="padding:10px 14px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; background:#fff;">
            <div>
              <div style="font-size:13px; font-weight:700; color:#15803d;">
                ${l.previousPrice !== null ? `From ${(item.currency || 'TZS')} ${l.previousPrice.toLocaleString()} → ${(item.currency || 'TZS')} ${l.newPrice.toLocaleString()}` : `Initial Approved Price: ${(item.currency || 'TZS')} ${l.newPrice.toLocaleString()}`}
              </div>
              <div style="font-size:11.5px; color:#64748b; margin-top:2px;">Updated by <strong>${escapeHTML(l.changedBy)}</strong></div>
            </div>
            <div style="font-size:11px; color:#94a3b8; text-align:right;">
              ${new Date(l.timestamp).toLocaleDateString()} ${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        `).join('');
      }
    }

    // Render routine activity log
    const logsContainer = document.getElementById("auditHistoryLogsList");
    if (logsContainer) {
      if (itemLogs.length === 0) {
        logsContainer.innerHTML = `<div style="padding:14px; font-size:12.5px; color:#64748b; background:#f8fafc; border-radius:8px;">No activity logged yet.</div>`;
      } else {
        logsContainer.innerHTML = itemLogs.map(l => `
          <div style="padding:10px 14px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; font-size:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="color:#0f172a; font-size:12.5px;">${escapeHTML(l.action)}</strong>
              <span style="font-size:11px; color:#64748b;">${new Date(l.timestamp).toLocaleString()}</span>
            </div>
            <div style="color:#334155; line-height:1.4;">${escapeHTML(l.details)}</div>
            <div style="font-size:11px; color:#64748b; margin-top:4px;">By: <strong>${escapeHTML(l.changedBy)}</strong></div>
          </div>
        `).join('');
      }
    }

    modal.style.display = "flex";
  }
  window.openAuditHistoryModalForDish = openAuditHistoryModalForDish;

  function openAuditHistoryModalForCurrentDish() {
    if (currentEditingDishId) {
      openAuditHistoryModalForDish(currentEditingDishId);
    }
  }
  window.openAuditHistoryModalForCurrentDish = openAuditHistoryModalForCurrentDish;

  function closeFoodAuditHistoryModal() {
    const modal = document.getElementById("foodAuditHistoryModal");
    if (modal) modal.style.display = "none";
  }
  window.closeFoodAuditHistoryModal = closeFoodAuditHistoryModal;

  // -------------------------------------------------------------
  // ADMIN CONTROL & GOVERNANCE ENGINE (Section 12)
  // -------------------------------------------------------------
  let adminSelectedFoodProviderId = 125;

  function handleAdminFoodProviderSelect(val) {
    adminSelectedFoodProviderId = val;
    renderAdminFoodMenusManagement();
  }
  window.handleAdminFoodProviderSelect = handleAdminFoodProviderSelect;

  function renderAdminFoodMenusManagement() {
    const container = document.getElementById("adminFoodMenuContentContainer");
    if (!container) return;

    const allServices = (typeof window.services !== 'undefined' && Array.isArray(window.services)) ? window.services : [];
    const foodServices = allServices.filter(s => s.type === 'Food' || s.serviceType === 'food');

    // Populate dropdown
    const selectEl = document.getElementById("adminFoodProviderSelect");
    if (selectEl) {
      selectEl.innerHTML = foodServices.map(s => `
        <option value="${s.id}" ${String(s.id) === String(adminSelectedFoodProviderId) ? 'selected' : ''}>
          🍽️ ${escapeHTML(s.name)} (${s.place || 'Arusha'}) • ${s.status}
        </option>
      `).join('');
    }

    const badgeEl = document.getElementById("adminFoodSummaryBadge");
    if (badgeEl) {
      const activeCount = foodServices.filter(s => s.status === 'Approved').length;
      badgeEl.textContent = `Active Food Providers: ${activeCount} of ${foodServices.length}`;
    }

    const currentSvc = foodServices.find(s => String(s.id) === String(adminSelectedFoodProviderId)) || foodServices[0] || {
      id: 125,
      name: "Mama Africa Restaurant",
      providerName: "Mama Fatuma Loshilari",
      phone: "+255 754 889 900",
      email: "mamaafrica@tripbna.com",
      place: "Arusha",
      status: "Approved",
      description: "Heritage family restaurant celebrating authentic Tanzanian & Swahili cooking."
    };

    const allMasterItems = getAllMasterFoodItems();
    const svcItems = allMasterItems.filter(i => String(i.serviceId) === String(currentSvc.id) || currentSvc.providerId === i.providerId || String(currentSvc.id) === '125');
    const availMap = getAllDailyAvailability();
    const allAuditLogs = getFoodAuditLogs();

    const pendingDishes = svcItems.filter(i => i.approvalStatus === 'PENDING_ADMIN_APPROVAL');
    const approvedDishes = svcItems.filter(i => i.approvalStatus === 'APPROVED' || i.status === 'Approved');

    container.innerHTML = `
      <!-- Provider Verification & Contact Shell -->
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:18px; margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h4 style="margin:0; font-size:18px; font-weight:800; color:#ffffff;">🍽️ ${escapeHTML(currentSvc.name)}</h4>
              <span class="badge" style="background:${currentSvc.status === 'Approved' ? '#166534' : '#b45309'}; color:#fff; font-size:11px; padding:3px 8px; border-radius:6px; font-weight:700;">
                ${currentSvc.status === 'Approved' ? '✅ APPROVED / ACTIVE' : '⏳ PENDING REVIEW'}
              </span>
            </div>
            <div style="font-size:12px; color:#94a3b8; margin-top:4px;">
              📍 <strong>Location:</strong> ${escapeHTML(currentSvc.place || 'Arusha')} • 👤 <strong>Contact:</strong> ${escapeHTML(currentSvc.contactPerson || currentSvc.providerName || 'Mama Fatuma')} • 📞 <strong>Phone:</strong> ${escapeHTML(currentSvc.phone || '+255 754 889 900')} • 📧 <strong>Email:</strong> ${escapeHTML(currentSvc.email || 'mamaafrica@tripbna.com')}
            </div>
            <div style="font-size:12px; color:#cbd5e1; margin-top:6px; max-width:700px; line-height:1.4;">
              ${escapeHTML(currentSvc.description || '')}
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="primary" style="background:#16a34a; font-size:12px; padding:6px 12px; border-radius:6px; font-weight:700;" onclick="adminApproveProvider(${currentSvc.id})">
              ✅ Confirm Provider Approved
            </button>
            <button type="button" class="ghost" style="color:#f87171; border-color:#7f1d1d; font-size:12px; padding:6px 12px; border-radius:6px; font-weight:700;" onclick="adminSuspendProvider(${currentSvc.id})">
              ⏸️ Suspend Provider
            </button>
          </div>
        </div>

        <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #1e293b; display:flex; gap:16px; font-size:11.5px; color:#38bdf8; flex-wrap:wrap;">
          <span>✓ Business License Verified</span>
          <span>✓ Food Hygiene Certificate #TZ-AR-2026-9041</span>
          <span>✓ Master Categories System Intact</span>
          <span>✓ Direct Daily Availability Active</span>
        </div>
      </div>

      <!-- Pending Food Dish Submissions (Section 9) -->
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:18px; margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; font-size:15px; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:6px;">
            <span>⏳ New Food Items Awaiting Admin Approval (${pendingDishes.length})</span>
          </h4>
          <span style="font-size:12px; color:#94a3b8;">Brand new menu items require 1-time admin review before live display</span>
        </div>

        ${pendingDishes.length === 0 ? `
          <div style="text-align:center; padding:20px; color:#94a3b8; font-size:12.5px; background:#1e293b; border-radius:8px;">
            ✓ No pending food dishes awaiting approval. All provider menu items are reviewed!
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${pendingDishes.map(d => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:#1e293b; border:1px solid #334155; border-radius:8px; padding:12px; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <img src="${(Array.isArray(d.images) && d.images[0]) || d.image || ''}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; border:1px solid #475569;">
                  <div>
                    <div style="font-weight:800; font-size:14px; color:#ffffff;">${escapeHTML(d.name)} <span class="badge" style="background:#0284c7; color:#fff; font-size:10px; padding:2px 6px;">${d.category}</span></div>
                    <div style="font-size:12px; color:#4ade80; font-weight:700; margin:2px 0;">
                      ${d.currency || 'TZS'} ${(Number(d.price) || 0).toLocaleString()} ${d.portion ? `• ${escapeHTML(d.portion)}` : ''}
                    </div>
                    <div style="font-size:11px; color:#94a3b8;">${escapeHTML(d.description || d.desc || '')}</div>
                  </div>
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" class="primary" style="background:#16a34a; font-size:12px; font-weight:700; padding:6px 12px; border-radius:6px;" onclick="adminApproveFoodDish('${d.id}')">
                    ✅ Approve Dish
                  </button>
                  <button type="button" class="ghost" style="color:#f87171; border-color:#ef4444; font-size:12px; font-weight:700; padding:6px 12px; border-radius:6px;" onclick="adminRejectFoodDish('${d.id}')">
                    ❌ Reject
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Master Menu & Today's Availability Matrix -->
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:18px; margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h4 style="margin:0; font-size:15px; font-weight:800; color:#f8fafc;">
              📋 Master Menu Catalog &amp; Today's Live Stock (${svcItems.length} Total Items)
            </h4>
            <div style="font-size:12px; color:#94a3b8; margin-top:2px;">
              Admin inspection &amp; emergency availability overrides.
            </div>
          </div>
          <button type="button" class="ghost" style="color:#cbd5e1; border-color:#334155; font-size:11.5px; padding:6px 10px; border-radius:6px;" onclick="renderAdminFoodMenusManagement()">
            🔄 Refresh Matrix
          </button>
        </div>

        <div style="overflow-x:auto;">
          <table class="table" style="width:100%; border-collapse:collapse; font-size:12.5px; color:#cbd5e1;">
            <thead>
              <tr style="background:#1e293b; border-bottom:1px solid #334155; text-align:left;">
                <th style="padding:8px 10px; color:#f8fafc;">Dish Name</th>
                <th style="padding:8px 10px; color:#f8fafc;">Category</th>
                <th style="padding:8px 10px; color:#f8fafc;">Price</th>
                <th style="padding:8px 10px; color:#f8fafc; text-align:center;">Today's Stock</th>
                <th style="padding:8px 10px; color:#f8fafc;">Status</th>
                <th style="padding:8px 10px; color:#f8fafc; text-align:right;">Admin Control</th>
              </tr>
            </thead>
            <tbody>
              ${svcItems.map(item => {
                const daily = availMap[item.id] || { is_available: true };
                const isAvail = daily.is_available && !daily.is_sold_out;
                const priceFormatted = (item.currency === 'TZS')
                  ? `TZS ${(Number(item.price) || 0).toLocaleString()}`
                  : `$${Number(item.price || 0).toFixed(2)}`;

                return `
                  <tr style="border-bottom:1px solid #1e293b;">
                    <td style="padding:10px; font-weight:700; color:#f8fafc;">${escapeHTML(item.name)}</td>
                    <td style="padding:10px;"><span class="badge" style="background:#1e293b; color:#38bdf8; border:1px solid #0369a1; padding:2px 6px; border-radius:4px; font-size:10.5px;">${item.category}</span></td>
                    <td style="padding:10px; color:#4ade80; font-weight:700;">${priceFormatted}</td>
                    <td style="padding:10px; text-align:center;">
                      <button type="button" onclick="adminOverrideFoodAvailability('${item.id}', ${!isAvail})" style="background:${isAvail ? '#166534' : '#334155'}; color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
                        ${isAvail ? '🟢 Available Today' : '⚪ Unavailable Today'}
                      </button>
                    </td>
                    <td style="padding:10px;">
                      <span style="font-size:11px; color:${item.approvalStatus === 'APPROVED' ? '#4ade80' : '#f59e0b'};">
                        ${item.approvalStatus || item.status}
                      </span>
                    </td>
                    <td style="padding:10px; text-align:right;">
                      <button type="button" class="ghost" style="color:#38bdf8; border-color:#0284c7; padding:4px 8px; font-size:11px; border-radius:4px;" onclick="openAuditHistoryModalForDish('${item.id}')">
                        📋 Price History
                      </button>
                      <button type="button" class="ghost" style="color:#f87171; border-color:#ef4444; padding:4px 8px; font-size:11px; border-radius:4px; margin-left:4px;" onclick="adminSuspendFoodDish('${item.id}')">
                        ⏸️ Suspend
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Audit Logs & Price History Ledger -->
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:18px;">
        <h4 style="margin:0 0 10px 0; font-size:15px; font-weight:800; color:#f8fafc;">
          📝 Recent Routine Edits &amp; Price Change Audit Ledger
        </h4>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${allAuditLogs.slice(0, 10).map(l => `
            <div style="background:#1e293b; border:1px solid #334155; border-radius:8px; padding:10px 14px; font-size:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                <strong style="color:#38bdf8;">${escapeHTML(l.action)} • ${escapeHTML(l.foodItemName)}</strong>
                <span style="font-size:11px; color:#94a3b8;">${new Date(l.timestamp).toLocaleString()}</span>
              </div>
              <div style="color:#cbd5e1;">${escapeHTML(l.details)}</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">Actor: <strong>${escapeHTML(l.changedBy)}</strong></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function adminApproveFoodDish(foodItemId) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    item.approvalStatus = "APPROVED";
    item.status = "AVAILABLE";
    item.approvedAt = new Date().toISOString();
    saveAllMasterFoodItems(allItems);

    addFoodAuditLog({
      foodItemId: item.id,
      foodItemName: item.name,
      serviceId: item.serviceId,
      action: "ADMIN_APPROVED",
      previousPrice: null,
      newPrice: item.price,
      details: `Platform Admin Jackson Loshilari approved food item "${item.name}". Provider can now manage daily availability directly.`,
      changedBy: "Jackson Loshilari (Admin)"
    });

    if (typeof showToast === 'function') {
      showToast(`✅ Food item "${item.name}" is APPROVED by Admin!`);
    }

    renderAdminFoodMenusManagement();
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
    if (typeof renderFoodSection === 'function') renderFoodSection();
  }
  window.adminApproveFoodDish = adminApproveFoodDish;

  function adminRejectFoodDish(foodItemId) {
    const reason = prompt("Enter rejection reason or guidance for the provider:", "Please upload higher quality photo or clarify ingredients.");
    if (reason === null) return;

    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    item.approvalStatus = "REJECTED";
    saveAllMasterFoodItems(allItems);

    addFoodAuditLog({
      foodItemId: item.id,
      foodItemName: item.name,
      serviceId: item.serviceId,
      action: "ADMIN_REJECTED",
      previousPrice: null,
      newPrice: null,
      details: `Admin rejected dish: ${reason}`,
      changedBy: "Jackson Loshilari (Admin)"
    });

    if (typeof showToast === 'function') {
      showToast(`Food dish "${item.name}" rejected.`);
    }

    renderAdminFoodMenusManagement();
    if (typeof renderCategories === 'function') renderCategories();
  }
  window.adminRejectFoodDish = adminRejectFoodDish;

  function adminSuspendFoodDish(foodItemId) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    item.approvalStatus = "SUSPENDED";
    saveAllMasterFoodItems(allItems);

    addFoodAuditLog({
      foodItemId: item.id,
      foodItemName: item.name,
      serviceId: item.serviceId,
      action: "ADMIN_SUSPENDED",
      previousPrice: null,
      newPrice: null,
      details: `Admin suspended food dish from public marketplace.`,
      changedBy: "Jackson Loshilari (Admin)"
    });

    if (typeof showToast === 'function') {
      showToast(`Suspended food dish "${item.name}"`);
    }

    renderAdminFoodMenusManagement();
    if (typeof renderCategories === 'function') renderCategories();
  }
  window.adminSuspendFoodDish = adminSuspendFoodDish;

  function adminOverrideFoodAvailability(foodItemId, nextAvailable) {
    const allItems = getAllMasterFoodItems();
    const item = allItems.find(i => String(i.id) === String(foodItemId));
    if (!item) return;

    const availMap = getAllDailyAvailability();
    const cur = availMap[foodItemId] || { is_available: true };
    availMap[foodItemId] = {
      ...cur,
      is_available: nextAvailable,
      is_sold_out: nextAvailable ? false : cur.is_sold_out,
      updated_by: "Jackson Loshilari (Admin Override)",
      updated_at: new Date().toISOString()
    };
    saveAllDailyAvailability(availMap);

    addFoodAuditLog({
      foodItemId: item.id,
      foodItemName: item.name,
      serviceId: item.serviceId,
      action: "AVAILABILITY_CHANGE",
      previousPrice: null,
      newPrice: null,
      details: `Admin override: today's stock set to ${nextAvailable ? 'Available' : 'Unavailable'}.`,
      changedBy: "Jackson Loshilari (Admin)"
    });

    renderAdminFoodMenusManagement();
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
  }
  window.adminOverrideFoodAvailability = adminOverrideFoodAvailability;

  function adminApproveAllPendingFoodItems() {
    const allItems = getAllMasterFoodItems();
    let count = 0;
    allItems.forEach(i => {
      if (i.approvalStatus === 'PENDING_ADMIN_APPROVAL') {
        i.approvalStatus = 'APPROVED';
        i.status = 'AVAILABLE';
        i.approvedAt = new Date().toISOString();
        count++;
      }
    });

    if (count > 0) {
      saveAllMasterFoodItems(allItems);
      addFoodAuditLog({
        foodItemId: "all_pending",
        foodItemName: "Batch Approval",
        serviceId: 125,
        action: "ADMIN_APPROVED",
        previousPrice: null,
        newPrice: null,
        details: `Batch approved ${count} pending food dish(es).`,
        changedBy: "Jackson Loshilari (Admin)"
      });
      if (typeof showToast === 'function') {
        showToast(`✅ Admin approved all ${count} pending food dish(es)!`);
      }
    } else {
      if (typeof showToast === 'function') showToast("No pending dishes to approve.");
    }

    renderAdminFoodMenusManagement();
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderViewMenu === 'function') renderViewMenu();
    if (typeof renderFoodSection === 'function') renderFoodSection();
  }
  window.adminApproveAllPendingFoodItems = adminApproveAllPendingFoodItems;

  function adminSuspendProvider(serviceId) {
    if (confirm("Suspend this food provider? All dishes will become temporarily hidden from travelers.")) {
      const allServices = (typeof window.services !== 'undefined') ? window.services : [];
      const svc = allServices.find(s => String(s.id) === String(serviceId));
      if (svc) {
        svc.status = "Suspended";
        svc.active = false;
      }
      if (typeof showToast === 'function') showToast(`Provider suspended.`);
      renderAdminFoodMenusManagement();
      if (typeof renderFoodSection === 'function') renderFoodSection();
    }
  }
  window.adminSuspendProvider = adminSuspendProvider;

  function adminApproveProvider(serviceId) {
    const allServices = (typeof window.services !== 'undefined') ? window.services : [];
    const svc = allServices.find(s => String(s.id) === String(serviceId));
    if (svc) {
      svc.status = "Approved";
      svc.active = true;
    }
    if (typeof showToast === 'function') showToast(`Provider confirmed Approved and Active!`);
    renderAdminFoodMenusManagement();
    if (typeof renderFoodSection === 'function') renderFoodSection();
  }
  window.adminApproveProvider = adminApproveProvider;

  // Global Exports
  window.STANDARD_FOOD_CATEGORIES = STANDARD_CATEGORIES;
  window.getAllMasterFoodItems = getAllMasterFoodItems;
  window.getAllDailyAvailability = getAllDailyAvailability;
  window.getFoodAuditLogs = getFoodAuditLogs;
  window.addFoodAuditLog = addFoodAuditLog;
  window.isFoodItemAvailableToday = isFoodItemAvailableToday;
  window.getDailyRecordForItem = getDailyRecordForItem;
  window.toggleDailyAvailability = toggleDailyAvailability;
  window.setDailySoldOut = setDailySoldOut;
  window.toggleCategoryDailyAvailability = toggleCategoryDailyAvailability;
  window.toggleFoodItemHidden = toggleFoodItemHidden;
  window.toggleFoodItemDiscontinued = toggleFoodItemDiscontinued;
  window.renderCategories = renderProviderFoodCategories;
  window.openAddDishModal = openAddDishModal;
  window.openEditDishModal = openEditDishModal;
  window.openEditDishModalById = openEditDishModalById;
  window.renderAdminFoodMenusManagement = renderAdminFoodMenusManagement;

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      getAllMasterFoodItems();
      getAllDailyAvailability();
    });
  } else {
    getAllMasterFoodItems();
    getAllDailyAvailability();
  }
})();
