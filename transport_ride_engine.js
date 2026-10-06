/**
 * TripBnA — Transport Ride-Request & Driver Management Engine
 * STRICT REQUIREMENTS:
 * 1. 3 Transport Types only: Motorcycle / Boda Boda 🏍️, Bajaji / Tuk-Tuk 🛺, Taxi 🚕
 * 2. Driver Registration is ADMIN-ONLY (Admin -> Transport -> Drivers -> Add Driver).
 * 3. Admin Transport Dashboard: Dashboard, Drivers, Routes & Prices, Ride Requests, Active Rides, Ride History, Commission, Service Areas.
 * 4. Routes & Fixed Prices: Manually configured fixed routes (e.g. Ngaramtoni -> Kisongo), same price both directions toggle.
 * 5. Customer Flow: Select Route -> Choose Transport Type -> Show Available Verified+Active+Online Drivers (phone hidden) -> Summary -> Request Ride.
 * 6. Ride Request with ID (TB-XXXX), fixed fare, commission, driver amount.
 * 7. Driver Interface: Incoming requests with [Accept] / [Decline], ride status transitions.
 * 8. Customer "Call Driver" button appears after acceptance (opens tel: dialer).
 * 9. Admin WhatsApp notification generated for 0635125212 (+255635125212) on new ride.
 * 10. Commission System: configurable by type (Fixed / Percentage).
 * 11. Driver availability toggle: 🟢 Available / 🔴 Offline.
 */

(function() {
  'use strict';

  // Storage Keys
  const LS_DRIVERS = 'tripbna_transport_drivers_v1';
  const LS_ROUTES = 'tripbna_transport_routes_v1';
  const LS_COMMISSION = 'tripbna_transport_commission_v1';
  const LS_RIDES = 'tripbna_transport_rides_v1';
  const LS_SERVICE_AREAS = 'tripbna_transport_areas_v1';

  const ADMIN_WHATSAPP_NUMBER = '255635125212'; // 0635125212

  // Default Service Areas
  const DEFAULT_AREAS = [
    "Arusha City Centre",
    "Ngaramtoni",
    "Kisongo",
    "Njiro",
    "Mbauda",
    "Sanawane",
    "Kilombero Market",
    "Usa River",
    "Moshi Town"
  ];

  // Default Commission Config (Section 15)
  const DEFAULT_COMMISSION = {
    "Motorcycle": { type: "fixed", value: 300 },       // TZS 300 per ride
    "Bajaji": { type: "fixed", value: 500 },           // TZS 500 per ride
    "Taxi": { type: "percentage", value: 15 }          // 15% per ride
  };

  // Default Routes (Section 4)
  const DEFAULT_ROUTES = [
    {
      id: "route_nga_kis",
      from: "Ngaramtoni",
      to: "Kisongo",
      motorcyclePrice: 1500,
      bajajiPrice: 2000,
      taxiPrice: 5000,
      active: true,
      samePriceBothDirections: true,
      serviceArea: "Arusha"
    },
    {
      id: "route_clk_njiro",
      from: "Clock Tower",
      to: "Njiro Complex",
      motorcyclePrice: 2000,
      bajajiPrice: 3000,
      taxiPrice: 8000,
      active: true,
      samePriceBothDirections: true,
      serviceArea: "Arusha"
    },
    {
      id: "route_mba_city",
      from: "Mbauda",
      to: "Arusha City Centre",
      motorcyclePrice: 1500,
      bajajiPrice: 2500,
      taxiPrice: 6000,
      active: true,
      samePriceBothDirections: true,
      serviceArea: "Arusha"
    },
    {
      id: "route_kil_san",
      from: "Kilombero Market",
      to: "Sanawane",
      motorcyclePrice: 1000,
      bajajiPrice: 1500,
      taxiPrice: 4000,
      active: true,
      samePriceBothDirections: true,
      serviceArea: "Arusha"
    }
  ];

  // Default Drivers (Admin-registered only, Section 2 & 7)
  const DEFAULT_DRIVERS = [
    {
      id: "drv_ahmed_1",
      name: "Ahmed Rashid",
      phone: "+255754112233",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      driverType: "Bajaji / Tuk-Tuk",
      vehicleReg: "T 123 ABC",
      vehicleModel: "TVS King Deluxe 200cc",
      vehicleColor: "Blue & Yellow",
      vehiclePhoto: "https://images.unsplash.com/photo-1596707328906-8d5f661a3507?auto=format&fit=crop&w=300&q=80",
      passengerCapacity: 3,
      licenseNumber: "DL-TZ-788912",
      licenseExpiry: "2027-12-31",
      operatingArea: "Ngaramtoni, Kisongo, Arusha City",
      verificationStatus: "Verified",
      accountStatus: "Active",
      isOnline: true,
      rating: 4.8,
      completedRides: 42,
      createdAt: "2026-09-15T09:00:00Z"
    },
    {
      id: "drv_juma_2",
      name: "Juma Bakari",
      phone: "+255765223344",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      driverType: "Bajaji / Tuk-Tuk",
      vehicleReg: "T 456 XYZ",
      vehicleModel: "Bajaj RE 4S 2022",
      vehicleColor: "Green",
      vehiclePhoto: "https://images.unsplash.com/photo-1596707328906-8d5f661a3507?auto=format&fit=crop&w=300&q=80",
      passengerCapacity: 3,
      licenseNumber: "DL-TZ-901234",
      licenseExpiry: "2028-06-30",
      operatingArea: "Ngaramtoni, Kisongo, Njiro",
      verificationStatus: "Verified",
      accountStatus: "Active",
      isOnline: true,
      rating: 4.6,
      completedRides: 38,
      createdAt: "2026-09-18T11:00:00Z"
    },
    {
      id: "drv_emanuel_3",
      name: "Emanuel Mollel",
      phone: "+255712334455",
      photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
      driverType: "Motorcycle / Boda Boda",
      vehicleReg: "MC 890 BCD",
      vehicleModel: "Boxer BM 150cc",
      vehicleColor: "Red",
      vehiclePhoto: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80",
      passengerCapacity: 1,
      licenseNumber: "DL-TZ-445566",
      licenseExpiry: "2027-08-15",
      operatingArea: "Ngaramtoni, Kisongo, Clock Tower",
      verificationStatus: "Verified",
      accountStatus: "Active",
      isOnline: true,
      rating: 4.9,
      completedRides: 65,
      createdAt: "2026-09-10T08:30:00Z"
    },
    {
      id: "drv_hassan_4",
      name: "Hassan Mwamba",
      phone: "+255784445566",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      driverType: "Taxi",
      vehicleReg: "T 789 EFG",
      vehicleModel: "Toyota Spacio 1.5L AC",
      vehicleColor: "Silver White",
      vehiclePhoto: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=300&q=80",
      passengerCapacity: 4,
      licenseNumber: "DL-TZ-112233",
      licenseExpiry: "2028-11-20",
      operatingArea: "Ngaramtoni, Kisongo, Njiro, Airport",
      verificationStatus: "Verified",
      accountStatus: "Active",
      isOnline: true,
      rating: 4.9,
      completedRides: 82,
      createdAt: "2026-09-05T07:15:00Z"
    }
  ];

  // Data Store Accessors
  function getDrivers() {
    try {
      const stored = localStorage.getItem(LS_DRIVERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    saveDrivers(DEFAULT_DRIVERS);
    return DEFAULT_DRIVERS;
  }

  function saveDrivers(drivers) {
    try {
      localStorage.setItem(LS_DRIVERS, JSON.stringify(drivers));
    } catch (e) {}
  }

  function getRoutes() {
    try {
      const stored = localStorage.getItem(LS_ROUTES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    saveRoutes(DEFAULT_ROUTES);
    return DEFAULT_ROUTES;
  }

  function saveRoutes(routes) {
    try {
      localStorage.setItem(LS_ROUTES, JSON.stringify(routes));
    } catch (e) {}
  }

  function getCommissionConfig() {
    try {
      const stored = localStorage.getItem(LS_COMMISSION);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    saveCommissionConfig(DEFAULT_COMMISSION);
    return DEFAULT_COMMISSION;
  }

  function saveCommissionConfig(cfg) {
    try {
      localStorage.setItem(LS_COMMISSION, JSON.stringify(cfg));
    } catch (e) {}
  }

  function getRides() {
    try {
      const stored = localStorage.getItem(LS_RIDES);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  function saveRides(rides) {
    try {
      localStorage.setItem(LS_RIDES, JSON.stringify(rides));
    } catch (e) {}
  }

  function getServiceAreas() {
    try {
      const stored = localStorage.getItem(LS_SERVICE_AREAS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_AREAS;
  }

  function saveServiceAreas(areas) {
    try {
      localStorage.setItem(LS_SERVICE_AREAS, JSON.stringify(areas));
    } catch (e) {}
  }

  // Calculate commission for a fare
  function calculateCommission(transportType, fare) {
    const config = getCommissionConfig();
    const key = transportType.includes("Motorcycle") ? "Motorcycle" : (transportType.includes("Bajaji") ? "Bajaji" : "Taxi");
    const rule = config[key] || { type: "fixed", value: 500 };

    let commission = 0;
    if (rule.type === "percentage") {
      commission = Math.round((fare * rule.value) / 100);
    } else {
      commission = Number(rule.value) || 0;
    }

    if (commission > fare) commission = fare;
    const driverAmount = fare - commission;

    return {
      fare,
      commission,
      driverAmount,
      ruleType: rule.type,
      ruleValue: rule.value
    };
  }

  // -------------------------------------------------------------------------
  // CUSTOMER RIDE REQUEST WORKFLOW (Sections 1, 5, 6, 7, 8, 9, 10, 13)
  // -------------------------------------------------------------------------
  let customerRideState = {
    selectedRouteId: null,
    selectedRoute: null,
    selectedTransportType: null, // "Motorcycle", "Bajaji", "Taxi"
    selectedDriverId: null,
    selectedDriver: null,
    activeRideId: null
  };

  function initCustomerRideBookingUI() {
    const box = document.getElementById("customerRideRequestSection");
    if (!box) return;

    renderRouteSelector();
  }

  // Render Route dropdown
  function renderRouteSelector() {
    const routes = getRoutes().filter(r => r.active !== false);
    const fromSelect = document.getElementById("rideSelectFrom");
    const toSelect = document.getElementById("rideSelectTo");
    if (!fromSelect || !toSelect) return;

    const fromLocations = Array.from(new Set(routes.map(r => r.from).concat(routes.filter(r => r.samePriceBothDirections).map(r => r.to))));
    const toLocations = Array.from(new Set(routes.map(r => r.to).concat(routes.filter(r => r.samePriceBothDirections).map(r => r.from))));

    fromSelect.innerHTML = `<option value="">-- Choose Pickup Location --</option>` +
      fromLocations.map(l => `<option value="${l}">${l}</option>`).join('');

    toSelect.innerHTML = `<option value="">-- Choose Destination --</option>` +
      toLocations.map(l => `<option value="${l}">${l}</option>`).join('');
  }

  // On customer chooses From / To
  function handleCustomerRouteChange() {
    const fromVal = document.getElementById("rideSelectFrom")?.value || "";
    const toVal = document.getElementById("rideSelectTo")?.value || "";
    const errorEl = document.getElementById("rideRouteUnavailableNotice");
    const transportTypeStep = document.getElementById("rideStepTransportType");
    const driversStep = document.getElementById("rideStepDrivers");
    const summaryStep = document.getElementById("rideStepSummary");

    if (driversStep) driversStep.style.display = "none";
    if (summaryStep) summaryStep.style.display = "none";

    if (!fromVal || !toVal) {
      if (errorEl) errorEl.style.display = "none";
      if (transportTypeStep) transportTypeStep.style.display = "none";
      return;
    }

    if (fromVal === toVal) {
      if (errorEl) {
        errorEl.textContent = "Pickup and destination cannot be the same.";
        errorEl.style.display = "block";
      }
      if (transportTypeStep) transportTypeStep.style.display = "none";
      return;
    }

    // Find route in admin config
    const routes = getRoutes().filter(r => r.active !== false);
    const matched = routes.find(r => {
      const direct = (r.from.toLowerCase() === fromVal.toLowerCase() && r.to.toLowerCase() === toVal.toLowerCase());
      const reverse = (r.samePriceBothDirections && r.from.toLowerCase() === toVal.toLowerCase() && r.to.toLowerCase() === fromVal.toLowerCase());
      return direct || reverse;
    });

    if (!matched) {
      if (errorEl) {
        errorEl.textContent = "This route is currently unavailable on TripBnA.";
        errorEl.style.display = "block";
      }
      if (transportTypeStep) transportTypeStep.style.display = "none";
      customerRideState.selectedRoute = null;
      customerRideState.selectedRouteId = null;
      return;
    }

    if (errorEl) errorEl.style.display = "none";
    customerRideState.selectedRoute = matched;
    customerRideState.selectedRouteId = matched.id;

    // Show Transport Types step (Section 6: ONLY Motorcycle, Bajaji, Taxi with fixed route prices)
    if (transportTypeStep) {
      transportTypeStep.style.display = "block";
      renderTransportTypeCards(matched);
    }
  }

  // Render 3 transport options with route prices
  function renderTransportTypeCards(route) {
    const container = document.getElementById("rideTransportTypeCardsGrid");
    if (!container) return;

    container.innerHTML = `
      <div class="card trans-type-card ${customerRideState.selectedTransportType === 'Motorcycle' ? 'active-type' : ''}" onclick="selectCustomerRideType('Motorcycle', ${route.motorcyclePrice})" style="cursor:pointer; padding:16px; border:2px solid ${customerRideState.selectedTransportType === 'Motorcycle' ? '#16a34a' : '#cbd5e1'}; border-radius:12px; background:${customerRideState.selectedTransportType === 'Motorcycle' ? '#f0fdf4' : '#ffffff'}; transition:all 0.2s;">
        <div style="font-size:32px; text-align:center;">🏍️</div>
        <div style="font-weight:800; font-size:15px; color:#0f172a; text-align:center; margin-top:6px;">Motorcycle / Boda Boda</div>
        <div style="font-size:12px; color:#64748b; text-align:center; margin-top:2px;">Fast single-passenger transit</div>
        <div style="font-size:18px; font-weight:900; color:#15803d; text-align:center; margin-top:10px;">
          TZS ${(Number(route.motorcyclePrice) || 1500).toLocaleString()}
        </div>
      </div>

      <div class="card trans-type-card ${customerRideState.selectedTransportType === 'Bajaji' ? 'active-type' : ''}" onclick="selectCustomerRideType('Bajaji', ${route.bajajiPrice})" style="cursor:pointer; padding:16px; border:2px solid ${customerRideState.selectedTransportType === 'Bajaji' ? '#16a34a' : '#cbd5e1'}; border-radius:12px; background:${customerRideState.selectedTransportType === 'Bajaji' ? '#f0fdf4' : '#ffffff'}; transition:all 0.2s;">
        <div style="font-size:32px; text-align:center;">🛺</div>
        <div style="font-weight:800; font-size:15px; color:#0f172a; text-align:center; margin-top:6px;">Bajaji / Tuk-Tuk</div>
        <div style="font-size:12px; color:#64748b; text-align:center; margin-top:2px;">Covered 1-3 passengers</div>
        <div style="font-size:18px; font-weight:900; color:#15803d; text-align:center; margin-top:10px;">
          TZS ${(Number(route.bajajiPrice) || 2000).toLocaleString()}
        </div>
      </div>

      <div class="card trans-type-card ${customerRideState.selectedTransportType === 'Taxi' ? 'active-type' : ''}" onclick="selectCustomerRideType('Taxi', ${route.taxiPrice})" style="cursor:pointer; padding:16px; border:2px solid ${customerRideState.selectedTransportType === 'Taxi' ? '#16a34a' : '#cbd5e1'}; border-radius:12px; background:${customerRideState.selectedTransportType === 'Taxi' ? '#f0fdf4' : '#ffffff'}; transition:all 0.2s;">
        <div style="font-size:32px; text-align:center;">🚕</div>
        <div style="font-weight:800; font-size:15px; color:#0f172a; text-align:center; margin-top:6px;">Taxi</div>
        <div style="font-size:12px; color:#64748b; text-align:center; margin-top:2px;">Private car with AC & trunk</div>
        <div style="font-size:18px; font-weight:900; color:#15803d; text-align:center; margin-top:10px;">
          TZS ${(Number(route.taxiPrice) || 5000).toLocaleString()}
        </div>
      </div>
    `;
  }

  // Select transport type & load available drivers (Section 7 & 8)
  function selectCustomerRideType(type, price) {
    customerRideState.selectedTransportType = type;
    customerRideState.selectedFare = price;

    if (customerRideState.selectedRoute) {
      renderTransportTypeCards(customerRideState.selectedRoute);
    }

    renderAvailableDriversList();
  }

  // Show available verified + active drivers (Section 7 & 8: Phone hidden!)
  function renderAvailableDriversList() {
    const driversStep = document.getElementById("rideStepDrivers");
    const container = document.getElementById("rideAvailableDriversContainer");
    if (!driversStep || !container) return;

    driversStep.style.display = "block";
    container.innerHTML = "";

    const allDrivers = getDrivers();
    const activeRides = getRides().filter(r => 
      r.status === 'Requested' || r.status === 'Accepted' || r.status === 'Driver Arriving' || r.status === 'Driver Arrived' || r.status === 'In Progress'
    );
    const busyDriverIds = new Set(activeRides.map(r => String(r.driverId)));

    const selectedType = customerRideState.selectedTransportType;
    const typeKeyword = selectedType.includes("Motorcycle") ? "Motorcycle" : (selectedType.includes("Bajaji") ? "Bajaji" : "Taxi");

    // Filter conditions per Section 7:
    // 1. Account verified
    // 2. Account active
    // 3. Driver is online / available
    // 4. Matches transport type
    // 5. Operates in route area
    // 6. Not currently assigned to active ride
    const eligibleDrivers = allDrivers.filter(d => {
      const isVerified = (d.verificationStatus === 'Verified');
      const isActive = (d.accountStatus === 'Active');
      const isOnline = (d.isOnline !== false);
      const matchesType = d.driverType.toLowerCase().includes(typeKeyword.toLowerCase());
      const notBusy = !busyDriverIds.has(String(d.id));

      return isVerified && isActive && isOnline && matchesType && notBusy;
    });

    if (eligibleDrivers.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:32px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; color:#64748b;">
          <div style="font-size:32px;">⏳</div>
          <h4 style="margin:8px 0; color:#1e293b;">No ${selectedType} Drivers Available Right Now</h4>
          <p style="font-size:13px; margin:0 0 12px 0;">All verified drivers for this route are currently on a trip or offline. Please check another transport type or retry in a few moments.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = eligibleDrivers.map(d => `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:16px; border:1.5px solid #e2e8f0; border-radius:12px; margin-bottom:12px; flex-wrap:wrap; gap:12px; background:#ffffff;">
        <div style="display:flex; align-items:center; gap:14px;">
          <img src="${d.photo}" style="width:64px; height:64px; border-radius:50%; object-fit:cover; border:2px solid #0284c7;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="font-size:16px; color:#0f172a;">${escapeHTML(d.name)}</strong>
              <span class="badge" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:11px; padding:2px 6px; border-radius:4px; font-weight:700;">🟢 Available</span>
            </div>
            <div style="font-size:13px; color:#64748b; margin-top:2px;">
              ⭐ <strong>${(Number(d.rating) || 4.8).toFixed(1)}</strong> • ${d.driverType}
            </div>
            <div style="font-size:12px; color:#334155; margin-top:3px;">
              🚗 Vehicle: <strong>${escapeHTML(d.vehicleReg)}</strong> (${escapeHTML(d.vehicleModel)}, ${escapeHTML(d.vehicleColor)})
            </div>
            <div style="font-size:11px; color:#0369a1; margin-top:2px;">
              📍 Operating Area: ${escapeHTML(d.operatingArea)}
            </div>
          </div>
        </div>
        <div>
          <!-- Section 8: Phone number is completely hidden! Only Select Driver button is shown -->
          <button type="button" class="primary" onclick="selectCustomerDriver('${d.id}')" style="background:#0284c7; color:#fff; font-weight:700; padding:10px 20px; font-size:13px; border-radius:8px; border:none; cursor:pointer;">
            Select Driver ➔
          </button>
        </div>
      </div>
    `).join('');
  }

  // Select driver & show ride summary (Section 9)
  function selectCustomerDriver(driverId) {
    const allDrivers = getDrivers();
    const driver = allDrivers.find(d => String(d.id) === String(driverId));
    if (!driver) return;

    customerRideState.selectedDriverId = driver.id;
    customerRideState.selectedDriver = driver;

    const summaryStep = document.getElementById("rideStepSummary");
    if (!summaryStep) return;

    const route = customerRideState.selectedRoute;
    const fromVal = document.getElementById("rideSelectFrom")?.value || route.from;
    const toVal = document.getElementById("rideSelectTo")?.value || route.to;
    const fare = customerRideState.selectedFare;

    const commInfo = calculateCommission(customerRideState.selectedTransportType, fare);

    summaryStep.style.display = "block";
    summaryStep.scrollIntoView({ behavior: 'smooth' });

    document.getElementById("summaryRouteDisplay").textContent = `${fromVal} → ${toVal}`;
    document.getElementById("summaryTransportDisplay").textContent = customerRideState.selectedTransportType;
    document.getElementById("summaryDriverNameDisplay").textContent = driver.name;
    document.getElementById("summaryVehicleDisplay").textContent = `${driver.vehicleReg} (${driver.vehicleModel}, ${driver.vehicleColor})`;
    document.getElementById("summaryFareDisplay").textContent = `TZS ${fare.toLocaleString()}`;

    // Store commission data for request creation
    customerRideState.currentCommInfo = commInfo;
  }

  // Create Ride Request (Section 10)
  function createCustomerRideRequest() {
    if (!customerRideState.selectedRoute || !customerRideState.selectedDriver || !customerRideState.selectedFare) {
      alert("Please select route, transport type, and driver.");
      return;
    }

    const fromVal = document.getElementById("rideSelectFrom")?.value || customerRideState.selectedRoute.from;
    const toVal = document.getElementById("rideSelectTo")?.value || customerRideState.selectedRoute.to;
    const driver = customerRideState.selectedDriver;
    const fare = customerRideState.selectedFare;
    const commInfo = customerRideState.currentCommInfo || calculateCommission(customerRideState.selectedTransportType, fare);

    const currentUser = window.currentUser || (window.auth && window.auth.currentUser);
    const customerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Traveler";
    const customerId = currentUser?.uid || "cust_" + Math.random().toString(36).substr(2, 6);
    const customerPhone = currentUser?.phoneNumber || "+255 700 000 000";

    const rideId = "TB-" + Math.floor(1000 + Math.random() * 9000);

    const newRide = {
      id: rideId,
      customerId,
      customerName,
      customerPhone,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverPhoto: driver.photo,
      vehicleReg: driver.vehicleReg,
      vehicleModel: driver.vehicleModel,
      vehicleColor: driver.vehicleColor,
      routeId: customerRideState.selectedRoute.id,
      from: fromVal,
      to: toVal,
      transportType: customerRideState.selectedTransportType,
      fare: fare,
      commissionAmount: commInfo.commission,
      driverAmount: commInfo.driverAmount,
      status: "Requested", // Section 10: Initial status REQUESTED
      requestTime: new Date().toISOString(),
      acceptedTime: null,
      completedTime: null,
      notes: ""
    };

    const rides = getRides();
    rides.unshift(newRide);
    saveRides(rides);

    customerRideState.activeRideId = rideId;

    // Section 14: Notify Admin (WhatsApp + recorded in Admin Dashboard)
    generateAdminRideNotification(newRide);

    // Update UI to Active Ride Tracker
    showCustomerActiveRideModal(newRide);

    // Refresh driver simulator & admin views
    if (typeof renderDriverSimulator === 'function') renderDriverSimulator();
    if (typeof renderAdminTransportDashboard === 'function') renderAdminTransportDashboard();

    if (typeof showToast === 'function') {
      showToast(`🎉 Ride ${rideId} requested! Waiting for driver ${driver.name} to accept.`);
    }
  }

  // Section 14: Admin WhatsApp Notification Service
  function generateAdminRideNotification(ride) {
    const textMsg = `*NEW TRIPBNA RIDE REQUEST*\n\n` +
      `*Ride ID:* ${ride.id}\n` +
      `*Customer:* ${ride.customerName}\n` +
      `*Route:* ${ride.from} → ${ride.to}\n` +
      `*Transport:* ${ride.transportType}\n` +
      `*Fare:* TZS ${ride.fare.toLocaleString()}\n` +
      `*Driver:* ${ride.driverName} (${ride.vehicleReg})\n` +
      `*TripBnA Commission:* TZS ${ride.commissionAmount.toLocaleString()}\n` +
      `*Driver Amount:* TZS ${ride.driverAmount.toLocaleString()}\n` +
      `*Status:* ${ride.status}\n\n` +
      `_Operations Concierge: +255 635 125 212_`;

    window._lastAdminRideNotification = {
      rideId: ride.id,
      phone: ADMIN_WHATSAPP_NUMBER,
      message: textMsg,
      url: `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(textMsg)}`
    };

    console.info("TripBnA Admin WhatsApp Notification Generated for 0635125212:", window._lastAdminRideNotification);
  }

  // Show Customer Live Ride Tracker & Call Driver button (Section 13)
  function showCustomerActiveRideModal(ride) {
    const modal = document.getElementById("customerActiveRideModal");
    if (!modal) return;

    renderCustomerActiveRideContent(ride);
    modal.style.display = "flex";
  }

  function renderCustomerActiveRideContent(ride) {
    const container = document.getElementById("customerActiveRideContent");
    if (!container) return;

    const isAccepted = (ride.status !== 'Requested' && ride.status !== 'Declined' && ride.status !== 'Cancelled');
    const isCompleted = (ride.status === 'Completed');

    let statusStepHtml = '';
    const steps = ['Requested', 'Accepted', 'Driver Arriving', 'Driver Arrived', 'In Progress', 'Completed'];
    const curIdx = steps.indexOf(ride.status);

    statusStepHtml = `
      <div style="display:flex; justify-content:space-between; margin:16px 0; position:relative;">
        ${steps.map((st, idx) => {
          const reached = idx <= curIdx;
          return `
            <div style="text-align:center; flex:1; position:relative; z-index:1;">
              <div style="width:24px; height:24px; border-radius:50%; background:${reached ? '#16a34a' : '#cbd5e1'}; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; margin:0 auto;">
                ${reached ? '✓' : idx + 1}
              </div>
              <div style="font-size:10px; font-weight:700; color:${reached ? '#15803d' : '#64748b'}; margin-top:4px; line-height:1.2;">
                ${st}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Section 13: Customer Contact After Acceptance (CALL DRIVER opens phone dialer tel:07...)
    let callDriverButton = '';
    if (isAccepted && !isCompleted) {
      callDriverButton = `
        <a href="tel:${ride.driverPhone}" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; background:#16a34a; color:#ffffff; font-weight:800; font-size:14px; padding:12px 20px; border-radius:10px; box-shadow:0 4px 12px rgba(22,163,74,0.3); flex:1; text-align:center;">
          <span>📞</span> Call Driver
        </a>
      `;
    } else {
      callDriverButton = `
        <button disabled style="padding:12px 20px; font-size:13px; font-weight:700; background:#f1f5f9; color:#94a3b8; border:1px solid #cbd5e1; border-radius:10px; cursor:not-allowed; flex:1;">
          📞 Call Driver (Available upon acceptance)
        </button>
      `;
    }

    container.innerHTML = `
      <div style="text-align:center; margin-bottom:12px;">
        <span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:12px; font-weight:800; padding:4px 12px; border-radius:999px;">
          Ride Ref: ${ride.id}
        </span>
        <h3 style="margin:8px 0 2px 0; font-size:20px; color:#0f172a;">${ride.from} ➔ ${ride.to}</h3>
        <div style="font-size:13px; color:#64748b;">${ride.transportType} • Fare: <strong>TZS ${ride.fare.toLocaleString()}</strong></div>
      </div>

      ${statusStepHtml}

      <!-- Driver Card -->
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:14px; margin-bottom:16px; display:flex; align-items:center; gap:14px;">
        <img src="${ride.driverPhoto}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid #0284c7;">
        <div style="flex:1;">
          <div style="font-weight:800; font-size:15px; color:#0f172a;">${escapeHTML(ride.driverName)}</div>
          <div style="font-size:12.5px; color:#475569; margin-top:2px;">
            🚗 Vehicle: <strong>${escapeHTML(ride.vehicleReg)}</strong> (${escapeHTML(ride.vehicleModel)}, ${escapeHTML(ride.vehicleColor)})
          </div>
          <div style="font-size:12px; color:#15803d; font-weight:700; margin-top:2px;">
            Status: ${ride.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
        ${callDriverButton}
        ${!isCompleted && ride.status !== 'In Progress' ? `
          <button type="button" class="ghost" onclick="cancelCustomerRide('${ride.id}')" style="padding:12px 16px; font-size:13px; color:#dc2626; border-color:#fca5a5; font-weight:700;">
            Cancel Ride
          </button>
        ` : ''}
        <button type="button" class="ghost" onclick="closeCustomerActiveRideModal()" style="padding:12px 16px; font-size:13px;">
          Close Window
        </button>
      </div>

      <!-- Admin WhatsApp notification trigger link -->
      <div style="margin-top:16px; padding-top:12px; border-top:1px dashed #e2e8f0; text-align:center;">
        <a href="${window._lastAdminRideNotification?.url || `https://wa.me/${ADMIN_WHATSAPP_NUMBER}`}" target="_blank" style="font-size:11.5px; color:#059669; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
          <span>💬</span> Operations WhatsApp Log (+255 635 125 212)
        </a>
      </div>
    `;
  }

  function closeCustomerActiveRideModal() {
    const modal = document.getElementById("customerActiveRideModal");
    if (modal) modal.style.display = "none";
  }

  function cancelCustomerRide(rideId) {
    if (!confirm("Are you sure you want to cancel this ride request?")) return;
    const rides = getRides();
    const r = rides.find(x => x.id === rideId);
    if (r) {
      r.status = "Cancelled";
      r.completedTime = new Date().toISOString();
      saveRides(rides);
      showToast("Ride cancelled.");
      closeCustomerActiveRideModal();
      if (typeof renderDriverSimulator === 'function') renderDriverSimulator();
      if (typeof renderAdminTransportDashboard === 'function') renderAdminTransportDashboard();
    }
  }

  // -------------------------------------------------------------------------
  // DRIVER INTERFACE: RECEIVE, ACCEPT, ADVANCE RIDES (Sections 11, 12, 16)
  // -------------------------------------------------------------------------
  function renderDriverSimulator() {
    const container = document.getElementById("driverSimulatorPanel");
    if (!container) return;

    const drivers = getDrivers();
    // Default active simulated driver: Ahmed Rashid
    const activeDriver = drivers.find(d => d.id === (window.currentSimulatedDriverId || "drv_ahmed_1")) || drivers[0];

    const allRides = getRides();
    const driverRides = allRides.filter(r => String(r.driverId) === String(activeDriver.id));
    const pendingRequest = driverRides.find(r => r.status === 'Requested');
    const activeRide = driverRides.find(r => ['Accepted', 'Driver Arriving', 'Driver Arrived', 'In Progress'].includes(r.status));

    container.innerHTML = `
      <div style="background:#0f172a; color:#f8fafc; border-radius:14px; padding:18px; border:1px solid #334155;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid #1e293b; padding-bottom:12px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:24px;">📱</span>
            <div>
              <div style="font-weight:800; font-size:16px; color:#ffffff;">TripBnA Driver Portal (Device Simulator)</div>
              <div style="font-size:12px; color:#94a3b8;">Driver: <strong>${escapeHTML(activeDriver.name)}</strong> • ${activeDriver.driverType} (${activeDriver.vehicleReg})</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <!-- Driver Availability Toggle (Section 16: Available / Offline) -->
            <button type="button" onclick="toggleDriverOnlineStatus('${activeDriver.id}')" style="background:${activeDriver.isOnline ? '#16a34a' : '#ef4444'}; color:#fff; border:none; padding:6px 14px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer;">
              ${activeDriver.isOnline ? '🟢 Available' : '🔴 Offline'}
            </button>
            <select onchange="switchSimulatedDriver(this.value)" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:6px 10px; border-radius:8px; font-size:12px;">
              ${drivers.map(d => `<option value="${d.id}" ${d.id === activeDriver.id ? 'selected' : ''}>Switch to: ${d.name} (${d.driverType})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Section 11: Driver Receives Request -->
        ${pendingRequest ? `
          <div style="background:#1e293b; border:2px solid #f59e0b; border-radius:12px; padding:16px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge" style="background:#f59e0b; color:#000; font-weight:800; font-size:11px; padding:2px 8px; border-radius:4px;">NEW RIDE REQUEST</span>
              <span style="font-size:12px; color:#94a3b8;">Ref: ${pendingRequest.id}</span>
            </div>
            <h4 style="margin:8px 0 4px 0; font-size:18px; color:#ffffff;">${pendingRequest.from} ➔ ${pendingRequest.to}</h4>
            <div style="font-size:13px; color:#cbd5e1; margin-bottom:10px;">
              Passenger: <strong>${escapeHTML(pendingRequest.customerName)}</strong> • Phone: <a href="tel:${pendingRequest.customerPhone}" style="color:#38bdf8;">${escapeHTML(pendingRequest.customerPhone)}</a>
            </div>
            <div style="background:#0f172a; padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <div>
                <span style="font-size:11px; color:#94a3b8;">Total Fare:</span>
                <div style="font-size:16px; font-weight:800; color:#4ade80;">TZS ${pendingRequest.fare.toLocaleString()}</div>
              </div>
              <div style="text-align:right;">
                <span style="font-size:11px; color:#94a3b8;">Your Earnings:</span>
                <div style="font-size:16px; font-weight:800; color:#38bdf8;">TZS ${pendingRequest.driverAmount.toLocaleString()}</div>
              </div>
            </div>
            <div style="display:flex; gap:10px;">
              <button type="button" class="primary" onclick="driverAcceptRide('${pendingRequest.id}')" style="flex:1; background:#16a34a; font-weight:800; padding:10px; font-size:14px; border-radius:8px;">
                ✅ Accept Ride
              </button>
              <button type="button" class="ghost" onclick="driverDeclineRide('${pendingRequest.id}')" style="flex:1; color:#f87171; border-color:#ef4444; font-weight:700; padding:10px; font-size:14px; border-radius:8px;">
                ❌ Decline
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Active Ride In Progress (Section 12: Status Transitions) -->
        ${activeRide ? `
          <div style="background:#1e293b; border:2px solid #0284c7; border-radius:12px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge" style="background:#0284c7; color:#fff; font-weight:800; font-size:11px; padding:2px 8px; border-radius:4px;">RIDE IN PROGRESS: ${activeRide.status.toUpperCase()}</span>
              <span style="font-size:12px; color:#94a3b8;">Ref: ${activeRide.id}</span>
            </div>
            <h4 style="margin:8px 0 4px 0; font-size:17px; color:#ffffff;">${activeRide.from} ➔ ${activeRide.to}</h4>
            <div style="font-size:13px; color:#cbd5e1; margin-bottom:12px;">
              Customer: <strong>${escapeHTML(activeRide.customerName)}</strong> • Call: <a href="tel:${activeRide.customerPhone}" style="color:#38bdf8;">${escapeHTML(activeRide.customerPhone)}</a>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${activeRide.status === 'Accepted' ? `
                <button type="button" class="primary" onclick="advanceRideStatus('${activeRide.id}', 'Driver Arriving')" style="background:#0284c7; padding:8px 16px; font-size:13px; font-weight:700;">
                  ➔ Mark "Driver Arriving"
                </button>
              ` : ''}
              ${activeRide.status === 'Driver Arriving' ? `
                <button type="button" class="primary" onclick="advanceRideStatus('${activeRide.id}', 'Driver Arrived')" style="background:#0284c7; padding:8px 16px; font-size:13px; font-weight:700;">
                  ➔ Mark "Driver Arrived at Pickup"
                </button>
              ` : ''}
              ${activeRide.status === 'Driver Arrived' ? `
                <button type="button" class="primary" onclick="advanceRideStatus('${activeRide.id}', 'In Progress')" style="background:#16a34a; padding:8px 16px; font-size:13px; font-weight:700;">
                  ➔ Start Trip ("In Progress")
                </button>
              ` : ''}
              ${activeRide.status === 'In Progress' ? `
                <button type="button" class="primary" onclick="advanceRideStatus('${activeRide.id}', 'Completed')" style="background:#16a34a; padding:10px 20px; font-size:14px; font-weight:800;">
                  🏁 Complete Ride &amp; Settle Fare
                </button>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${!pendingRequest && !activeRide ? `
          <div style="text-align:center; padding:24px; color:#94a3b8; font-size:13px;">
            ${activeDriver.isOnline ? '🟢 You are ONLINE and ready for ride requests on your route.' : '🔴 You are OFFLINE. Toggle "Available" above to receive ride requests.'}
          </div>
        ` : ''}
      </div>
    `;
  }

  function switchSimulatedDriver(driverId) {
    window.currentSimulatedDriverId = driverId;
    renderDriverSimulator();
  }

  function toggleDriverOnlineStatus(driverId) {
    const drivers = getDrivers();
    const d = drivers.find(x => x.id === driverId);
    if (d) {
      d.isOnline = !d.isOnline;
      saveDrivers(drivers);
      showToast(`${d.name} is now ${d.isOnline ? '🟢 Available' : '🔴 Offline'}`);
      renderDriverSimulator();
      if (typeof renderAvailableDriversList === 'function') renderAvailableDriversList();
      if (typeof renderAdminDriversListTab === 'function') renderAdminDriversListTab();
    }
  }

  function driverAcceptRide(rideId) {
    const rides = getRides();
    const r = rides.find(x => x.id === rideId);
    if (r) {
      r.status = "Accepted";
      r.acceptedTime = new Date().toISOString();
      saveRides(rides);
      showToast(`Ride ${r.id} Accepted! Contact passenger now.`);
      renderDriverSimulator();
      if (customerRideState.activeRideId === rideId) {
        renderCustomerActiveRideContent(r);
      }
      if (typeof renderAdminTransportDashboard === 'function') renderAdminTransportDashboard();
    }
  }

  function driverDeclineRide(rideId) {
    const rides = getRides();
    const r = rides.find(x => x.id === rideId);
    if (r) {
      r.status = "Declined";
      saveRides(rides);
      showToast(`Ride ${r.id} Declined.`);
      renderDriverSimulator();
      if (customerRideState.activeRideId === rideId) {
        renderCustomerActiveRideContent(r);
      }
      if (typeof renderAdminTransportDashboard === 'function') renderAdminTransportDashboard();
    }
  }

  // Section 12: Status transitions
  function advanceRideStatus(rideId, nextStatus) {
    const rides = getRides();
    const r = rides.find(x => x.id === rideId);
    if (r) {
      r.status = nextStatus;
      if (nextStatus === 'Completed') {
        r.completedTime = new Date().toISOString();
        // Section 16: Driver becomes available again if still online
      }
      saveRides(rides);
      showToast(`Ride status updated to: ${nextStatus}`);
      renderDriverSimulator();
      if (customerRideState.activeRideId === rideId) {
        renderCustomerActiveRideContent(r);
      }
      if (typeof renderAdminTransportDashboard === 'function') renderAdminTransportDashboard();
    }
  }

  // -------------------------------------------------------------------------
  // ADMIN TRANSPORT DASHBOARD: 8 SUB-SECTIONS (Sections 2, 3, 4, 15, 17, 18)
  // -------------------------------------------------------------------------
  let adminActiveTransportSubtab = 'dashboard';

  function renderAdminTransportDashboard() {
    const container = document.getElementById("adminSection_transport");
    if (!container) return;

    const drivers = getDrivers();
    const routes = getRoutes();
    const rides = getRides();
    const commConfig = getCommissionConfig();

    const activeRides = rides.filter(r => ['Requested', 'Accepted', 'Driver Arriving', 'Driver Arrived', 'In Progress'].includes(r.status));
    const completedRides = rides.filter(r => r.status === 'Completed');
    const totalRevenue = completedRides.reduce((sum, r) => sum + (Number(r.fare) || 0), 0);
    const totalCommission = completedRides.reduce((sum, r) => sum + (Number(r.commissionAmount) || 0), 0);

    container.innerHTML = `
      <!-- Admin Transport Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 style="margin:0; font-size:20px; font-weight:800; color:#ffffff;">🚗 Transport Governance &amp; Ride Dispatch</h3>
            <span class="badge" style="background:#0284c7; color:#fff; font-size:11px; padding:2px 8px; border-radius:999px;">Admin-Only Driver Control</span>
          </div>
          <p style="margin:4px 0 0 0; font-size:12px; color:#94a3b8;">
            Admin registers verified drivers, configures fixed routes &amp; prices, monitors live rides, and configures TripBnA commission.
          </p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="primary" onclick="openAdminAddDriverModal()" style="background:#16a34a; font-weight:800; font-size:12px; padding:8px 14px; border-radius:8px; border:none; cursor:pointer;">
            ➕ Add Driver (Admin Only)
          </button>
          <button type="button" class="primary" onclick="openAdminAddRouteModal()" style="background:#0284c7; font-weight:800; font-size:12px; padding:8px 14px; border-radius:8px; border:none; cursor:pointer;">
            ➕ Add Route &amp; Fixed Prices
          </button>
        </div>
      </div>

      <!-- 8 Admin Sub-Navigation Tabs (Section 3) -->
      <div style="display:flex; gap:6px; overflow-x:auto; background:#0f172a; padding:6px; border-radius:10px; border:1px solid #1e293b; margin-bottom:18px;">
        <button type="button" class="ghost admin-trans-subnav ${adminActiveTransportSubtab === 'dashboard' ? 'active-sub' : ''}" onclick="switchAdminTransportSubtab('dashboard')">📊 Dashboard</button>
        <button type="button" class="ghost admin-trans-subnav ${adminActiveTransportSubtab === 'drivers' ? 'active-sub' : ''}" onclick="switchAdminTransportSubtab('drivers')">👨‍✈️ Drivers (${drivers.length})</button>
        <button type="button" class="ghost admin-trans-subnav ${adminActiveTransportSubtab === 'routes' ? 'active-sub' : ''}" onclick="switchAdminTransportSubtab('routes')">🛣️ Routes &amp; Prices (${routes.length})</button>
        <button type="button" class="ghost admin-trans-subnav ${adminActiveTransportSubtab === 'requests' ? 'active-sub' : ''}" onclick="switchAdminTransportSubtab('requests')">⚡ Ride Requests (${rides.filter(r => r.status === 'Requested').length})</button>
        <button type="button" class="ghost admin-trans-subnav ${adminActiveTransportSubtab === 'active_rides' ? 'active-sub' : ''}" onclick="switchAdminTransportSubtab('active_rides')">🟢 Active Rides (${activeRides.length})</button>
        <button type="button" class="ghost admin-trans-subnav ${adminActiveTransportSubtab === 'history' ? 'active-sub' : ''}" onclick="switchAdminTransportSubtab('history')">📜 Ride History (${completedRides.length})</button>
        <button type="button" class="ghost admin-trans-subnav ${adminActiveTransportSubtab === 'commission' ? 'active-sub' : ''}" onclick="switchAdminTransportSubtab('commission')">💰 Commission</button>
        <button type="button" class="ghost admin-trans-subnav ${adminActiveTransportSubtab === 'areas' ? 'active-sub' : ''}" onclick="switchAdminTransportSubtab('areas')">📍 Service Areas</button>
      </div>

      <!-- Tab Content Area -->
      <div id="adminTransportTabContent">
        <!-- Rendered based on adminActiveTransportSubtab -->
      </div>
    `;

    renderAdminTransportSubtabContent();
  }

  function switchAdminTransportSubtab(tabKey) {
    adminActiveTransportSubtab = tabKey;
    renderAdminTransportDashboard();
  }

  function renderAdminTransportSubtabContent() {
    const container = document.getElementById("adminTransportTabContent");
    if (!container) return;

    switch (adminActiveTransportSubtab) {
      case 'dashboard': renderAdminOverviewTab(container); break;
      case 'drivers': renderAdminDriversListTab(container); break;
      case 'routes': renderAdminRoutesTab(container); break;
      case 'requests': renderAdminRequestsTab(container); break;
      case 'active_rides': renderAdminActiveRidesTab(container); break;
      case 'history': renderAdminHistoryTab(container); break;
      case 'commission': renderAdminCommissionTab(container); break;
      case 'areas': renderAdminAreasTab(container); break;
      default: renderAdminOverviewTab(container); break;
    }
  }

  // Subtab 1: Dashboard Overview
  function renderAdminOverviewTab(container) {
    const drivers = getDrivers();
    const routes = getRoutes();
    const rides = getRides();
    const completedRides = rides.filter(r => r.status === 'Completed');
    const totalRev = completedRides.reduce((acc, r) => acc + (Number(r.fare) || 0), 0);
    const totalComm = completedRides.reduce((acc, r) => acc + (Number(r.commissionAmount) || 0), 0);

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:20px;">
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:16px;">
          <div style="font-size:11.5px; font-weight:700; color:#94a3b8; text-transform:uppercase;">Verified Drivers</div>
          <div style="font-size:26px; font-weight:900; color:#38bdf8; margin-top:4px;">${drivers.filter(d => d.verificationStatus === 'Verified').length}</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">${drivers.filter(d => d.isOnline).length} currently online</div>
        </div>
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:16px;">
          <div style="font-size:11.5px; font-weight:700; color:#94a3b8; text-transform:uppercase;">Fixed Routes</div>
          <div style="font-size:26px; font-weight:900; color:#a78bfa; margin-top:4px;">${routes.length}</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">${routes.filter(r => r.active).length} active routes</div>
        </div>
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:16px;">
          <div style="font-size:11.5px; font-weight:700; color:#94a3b8; text-transform:uppercase;">Completed Rides</div>
          <div style="font-size:26px; font-weight:900; color:#4ade80; margin-top:4px;">${completedRides.length}</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">Gross Fares: TZS ${totalRev.toLocaleString()}</div>
        </div>
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:16px;">
          <div style="font-size:11.5px; font-weight:700; color:#94a3b8; text-transform:uppercase;">TripBnA Commission</div>
          <div style="font-size:26px; font-weight:900; color:#f59e0b; margin-top:4px;">TZS ${totalComm.toLocaleString()}</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">Admin WhatsApp: 0635125212</div>
        </div>
      </div>

      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:18px;">
        <h4 style="margin:0 0 12px 0; font-size:15px; color:#ffffff;">⚡ Quick Actions</h4>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button type="button" class="primary" onclick="openAdminAddDriverModal()" style="background:#16a34a; font-weight:700; font-size:12.5px; padding:8px 16px; border-radius:8px;">➕ Register New Driver</button>
          <button type="button" class="primary" onclick="openAdminAddRouteModal()" style="background:#0284c7; font-weight:700; font-size:12.5px; padding:8px 16px; border-radius:8px;">➕ Add Fixed Price Route</button>
          <button type="button" class="ghost" onclick="switchAdminTransportSubtab('commission')" style="color:#cbd5e1; border-color:#334155; font-size:12.5px; padding:8px 16px; border-radius:8px;">⚙️ Adjust Commission Rates</button>
        </div>
      </div>
    `;
  }

  // Subtab 2: Drivers (Admin-Only Registration, Section 2 & 17)
  function renderAdminDriversListTab(container) {
    const drivers = getDrivers();

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
        <h4 style="margin:0; font-size:16px; color:#ffffff;">TripBnA Registered Drivers (Admin Only)</h4>
        <button type="button" class="primary" onclick="openAdminAddDriverModal()" style="background:#16a34a; font-weight:700; font-size:12px; padding:6px 14px; border-radius:6px;">
          ➕ Add Driver
        </button>
      </div>

      <div style="overflow-x:auto; background:#0f172a; border:1px solid #1e293b; border-radius:12px;">
        <table style="width:100%; border-collapse:collapse; font-size:12.5px; color:#cbd5e1;">
          <thead>
            <tr style="background:#1e293b; border-bottom:1px solid #334155; text-align:left;">
              <th style="padding:10px; color:#fff;">Driver</th>
              <th style="padding:10px; color:#fff;">Transport Type</th>
              <th style="padding:10px; color:#fff;">Vehicle &amp; Reg</th>
              <th style="padding:10px; color:#fff;">Phone (Admin Eyes Only)</th>
              <th style="padding:10px; color:#fff;">Operating Area</th>
              <th style="padding:10px; color:#fff;">Status</th>
              <th style="padding:10px; color:#fff; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${drivers.map(d => `
              <tr style="border-bottom:1px solid #1e293b;">
                <td style="padding:10px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${d.photo}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                    <div>
                      <strong style="color:#fff;">${escapeHTML(d.name)}</strong>
                      <div style="font-size:11px; color:#94a3b8;">⭐ ${d.rating || 4.8} (${d.completedRides || 0} rides)</div>
                    </div>
                  </div>
                </td>
                <td style="padding:10px;"><span class="badge" style="background:#1e293b; border:1px solid #0369a1; color:#38bdf8; font-size:11px; padding:2px 6px; border-radius:4px;">${d.driverType}</span></td>
                <td style="padding:10px;">
                  <strong style="color:#fff;">${escapeHTML(d.vehicleReg)}</strong>
                  <div style="font-size:11px; color:#94a3b8;">${escapeHTML(d.vehicleModel)}</div>
                </td>
                <td style="padding:10px;"><a href="tel:${d.phone}" style="color:#4ade80;">${escapeHTML(d.phone)}</a></td>
                <td style="padding:10px; font-size:11.5px;">${escapeHTML(d.operatingArea || 'Arusha')}</td>
                <td style="padding:10px;">
                  <span class="chip" style="font-size:10.5px; padding:2px 6px; border-radius:4px; font-weight:700; ${d.accountStatus === 'Active' ? 'background:#166534; color:#4ade80;' : 'background:#7f1d1d; color:#f87171;'}">
                    ${d.verificationStatus} • ${d.accountStatus}
                  </span>
                  <div style="font-size:10px; color:${d.isOnline ? '#4ade80' : '#94a3b8'}; margin-top:2px;">
                    ${d.isOnline ? '🟢 Online' : '🔴 Offline'}
                  </div>
                </td>
                <td style="padding:10px; text-align:right;">
                  <button type="button" class="ghost" onclick="adminToggleDriverStatus('${d.id}')" style="font-size:11px; padding:4px 8px; color:#38bdf8; border-color:#0284c7; border-radius:4px;">
                    ${d.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" class="ghost" onclick="adminDeleteDriver('${d.id}')" style="font-size:11px; padding:4px 8px; color:#f87171; border-color:#ef4444; border-radius:4px; margin-left:4px;">
                    Delete
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Subtab 3: Routes & Fixed Prices (Sections 4 & 18)
  function renderAdminRoutesTab(container) {
    const routes = getRoutes();

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
        <div>
          <h4 style="margin:0; font-size:16px; color:#ffffff;">Fixed Price Routes</h4>
          <span style="font-size:12px; color:#94a3b8;">TripBnA enforces manual admin route pricing instead of pure meter estimations</span>
        </div>
        <button type="button" class="primary" onclick="openAdminAddRouteModal()" style="background:#0284c7; font-weight:700; font-size:12px; padding:6px 14px; border-radius:6px;">
          ➕ Add Route
        </button>
      </div>

      <div style="overflow-x:auto; background:#0f172a; border:1px solid #1e293b; border-radius:12px;">
        <table style="width:100%; border-collapse:collapse; font-size:12.5px; color:#cbd5e1;">
          <thead>
            <tr style="background:#1e293b; border-bottom:1px solid #334155; text-align:left;">
              <th style="padding:10px; color:#fff;">Route</th>
              <th style="padding:10px; color:#fff;">Both Directions?</th>
              <th style="padding:10px; color:#fff;">🏍️ Motorcycle</th>
              <th style="padding:10px; color:#fff;">🛺 Bajaji</th>
              <th style="padding:10px; color:#fff;">🚕 Taxi</th>
              <th style="padding:10px; color:#fff;">Status</th>
              <th style="padding:10px; color:#fff; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${routes.map(r => `
              <tr style="border-bottom:1px solid #1e293b;">
                <td style="padding:10px; font-weight:700; color:#fff;">
                  ${escapeHTML(r.from)} ➔ ${escapeHTML(r.to)}
                </td>
                <td style="padding:10px;">
                  ${r.samePriceBothDirections ? '<span style="color:#4ade80;">✓ Yes (Bi-directional)</span>' : '<span style="color:#f59e0b;">One-way only</span>'}
                </td>
                <td style="padding:10px; color:#4ade80; font-weight:700;">TZS ${(Number(r.motorcyclePrice) || 0).toLocaleString()}</td>
                <td style="padding:10px; color:#4ade80; font-weight:700;">TZS ${(Number(r.bajajiPrice) || 0).toLocaleString()}</td>
                <td style="padding:10px; color:#4ade80; font-weight:700;">TZS ${(Number(r.taxiPrice) || 0).toLocaleString()}</td>
                <td style="padding:10px;">
                  <span class="chip" style="font-size:10.5px; padding:2px 6px; border-radius:4px; font-weight:700; ${r.active ? 'background:#166534; color:#4ade80;' : 'background:#7f1d1d; color:#f87171;'}">
                    ${r.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style="padding:10px; text-align:right;">
                  <button type="button" class="ghost" onclick="adminToggleRouteActive('${r.id}')" style="font-size:11px; padding:4px 8px; color:#38bdf8; border-color:#0284c7; border-radius:4px;">
                    ${r.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" class="ghost" onclick="adminDeleteRoute('${r.id}')" style="font-size:11px; padding:4px 8px; color:#f87171; border-color:#ef4444; border-radius:4px; margin-left:4px;">
                    Delete
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Subtab 4: Ride Requests (Section 10)
  function renderAdminRequestsTab(container) {
    const rides = getRides().filter(r => r.status === 'Requested');

    container.innerHTML = `
      <h4 style="margin:0 0 12px 0; font-size:16px; color:#ffffff;">Pending Ride Requests (${rides.length})</h4>
      ${rides.length === 0 ? `
        <div style="text-align:center; padding:32px; background:#0f172a; border-radius:12px; color:#94a3b8;">
          No unassigned or requested rides right now.
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${rides.map(r => `
            <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <strong style="font-size:15px; color:#fff;">Ref: ${r.id}</strong>
                  <span class="badge" style="background:#f59e0b; color:#000; font-weight:800; font-size:10px;">REQUESTED</span>
                </div>
                <div style="font-size:14px; color:#38bdf8; font-weight:700; margin:3px 0;">${r.from} ➔ ${r.to} (${r.transportType})</div>
                <div style="font-size:12px; color:#94a3b8;">Passenger: ${r.customerName} • Driver: ${r.driverName} (${r.vehicleReg})</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:16px; font-weight:800; color:#4ade80;">TZS ${r.fare.toLocaleString()}</div>
                <div style="font-size:11px; color:#f59e0b;">Commission: TZS ${r.commissionAmount.toLocaleString()}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  // Subtab 5: Active Rides (Section 12)
  function renderAdminActiveRidesTab(container) {
    const active = getRides().filter(r => ['Accepted', 'Driver Arriving', 'Driver Arrived', 'In Progress'].includes(r.status));

    container.innerHTML = `
      <h4 style="margin:0 0 12px 0; font-size:16px; color:#ffffff;">Active In-Flight Rides (${active.length})</h4>
      ${active.length === 0 ? `
        <div style="text-align:center; padding:32px; background:#0f172a; border-radius:12px; color:#94a3b8;">
          No active rides in progress.
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${active.map(r => `
            <div style="background:#0f172a; border:1px solid #0284c7; border-radius:12px; padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div>
                <span class="badge" style="background:#0284c7; color:#fff; font-weight:800; font-size:11px;">${r.status.toUpperCase()}</span>
                <h4 style="margin:6px 0; font-size:16px; color:#fff;">${r.from} ➔ ${r.to}</h4>
                <div style="font-size:12.5px; color:#cbd5e1;">
                  Passenger: <strong>${r.customerName}</strong> (${r.customerPhone}) • Driver: <strong>${r.driverName}</strong> (${r.driverPhone})
                </div>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button" class="primary" onclick="advanceRideStatus('${r.id}', 'Completed')" style="background:#16a34a; font-weight:800; font-size:12px; padding:8px 14px; border-radius:6px;">
                  🏁 Force Complete
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  // Subtab 6: Ride History
  function renderAdminHistoryTab(container) {
    const rides = getRides().filter(r => ['Completed', 'Cancelled', 'Declined'].includes(r.status));

    container.innerHTML = `
      <h4 style="margin:0 0 12px 0; font-size:16px; color:#ffffff;">Completed Ride History (${rides.length})</h4>
      <div style="overflow-x:auto; background:#0f172a; border:1px solid #1e293b; border-radius:12px;">
        <table style="width:100%; border-collapse:collapse; font-size:12.5px; color:#cbd5e1;">
          <thead>
            <tr style="background:#1e293b; border-bottom:1px solid #334155; text-align:left;">
              <th style="padding:10px; color:#fff;">Ref</th>
              <th style="padding:10px; color:#fff;">Route</th>
              <th style="padding:10px; color:#fff;">Transport</th>
              <th style="padding:10px; color:#fff;">Fare</th>
              <th style="padding:10px; color:#fff;">Commission</th>
              <th style="padding:10px; color:#fff;">Driver Earned</th>
              <th style="padding:10px; color:#fff;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rides.map(r => `
              <tr style="border-bottom:1px solid #1e293b;">
                <td style="padding:10px; font-weight:700; color:#fff;">${r.id}</td>
                <td style="padding:10px;">${r.from} ➔ ${r.to}</td>
                <td style="padding:10px;">${r.transportType}</td>
                <td style="padding:10px; color:#4ade80; font-weight:700;">TZS ${(Number(r.fare) || 0).toLocaleString()}</td>
                <td style="padding:10px; color:#f59e0b; font-weight:700;">TZS ${(Number(r.commissionAmount) || 0).toLocaleString()}</td>
                <td style="padding:10px; color:#38bdf8; font-weight:700;">TZS ${(Number(r.driverAmount) || 0).toLocaleString()}</td>
                <td style="padding:10px;">
                  <span style="font-size:11px; font-weight:700; color:${r.status === 'Completed' ? '#4ade80' : '#f87171'};">
                    ${r.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Subtab 7: Commission System (Section 15)
  function renderAdminCommissionTab(container) {
    const config = getCommissionConfig();

    container.innerHTML = `
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:20px; max-width:650px;">
        <h4 style="margin:0 0 6px 0; font-size:17px; color:#ffffff;">TripBnA Commission Settings</h4>
        <p style="font-size:12px; color:#94a3b8; margin:0 0 16px 0;">Configure platform commission per transport type. Supports both Fixed amount (TZS) and Percentage (%).</p>

        <form id="adminCommissionForm" onsubmit="handleSaveCommission(event)">
          <!-- Motorcycle -->
          <div style="background:#1e293b; border-radius:10px; padding:14px; margin-bottom:14px;">
            <strong style="font-size:14px; color:#fff; display:block; margin-bottom:6px;">🏍️ Motorcycle / Boda Boda Commission</strong>
            <div style="display:flex; gap:10px;">
              <select id="commType_Motorcycle" style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px; border-radius:6px; font-size:12px;">
                <option value="fixed" ${config.Motorcycle?.type === 'fixed' ? 'selected' : ''}>Fixed Amount (TZS)</option>
                <option value="percentage" ${config.Motorcycle?.type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
              </select>
              <input id="commVal_Motorcycle" type="number" value="${config.Motorcycle?.value || 300}" style="flex:1; background:#0f172a; color:#fff; border:1px solid #334155; padding:8px; border-radius:6px; font-size:12px;" required />
            </div>
          </div>

          <!-- Bajaji -->
          <div style="background:#1e293b; border-radius:10px; padding:14px; margin-bottom:14px;">
            <strong style="font-size:14px; color:#fff; display:block; margin-bottom:6px;">🛺 Bajaji / Tuk-Tuk Commission</strong>
            <div style="display:flex; gap:10px;">
              <select id="commType_Bajaji" style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px; border-radius:6px; font-size:12px;">
                <option value="fixed" ${config.Bajaji?.type === 'fixed' ? 'selected' : ''}>Fixed Amount (TZS)</option>
                <option value="percentage" ${config.Bajaji?.type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
              </select>
              <input id="commVal_Bajaji" type="number" value="${config.Bajaji?.value || 500}" style="flex:1; background:#0f172a; color:#fff; border:1px solid #334155; padding:8px; border-radius:6px; font-size:12px;" required />
            </div>
          </div>

          <!-- Taxi -->
          <div style="background:#1e293b; border-radius:10px; padding:14px; margin-bottom:16px;">
            <strong style="font-size:14px; color:#fff; display:block; margin-bottom:6px;">🚕 Taxi Commission</strong>
            <div style="display:flex; gap:10px;">
              <select id="commType_Taxi" style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px; border-radius:6px; font-size:12px;">
                <option value="percentage" ${config.Taxi?.type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
                <option value="fixed" ${config.Taxi?.type === 'fixed' ? 'selected' : ''}>Fixed Amount (TZS)</option>
              </select>
              <input id="commVal_Taxi" type="number" value="${config.Taxi?.value || 15}" style="flex:1; background:#0f172a; color:#fff; border:1px solid #334155; padding:8px; border-radius:6px; font-size:12px;" required />
            </div>
          </div>

          <button type="submit" class="primary" style="background:#16a34a; font-weight:800; padding:10px 20px; font-size:13px; border-radius:8px;">
            💾 Save Commission Settings
          </button>
        </form>
      </div>
    `;
  }

  function handleSaveCommission(e) {
    if (e) e.preventDefault();
    const newConfig = {
      Motorcycle: {
        type: document.getElementById("commType_Motorcycle").value,
        value: Number(document.getElementById("commVal_Motorcycle").value) || 300
      },
      Bajaji: {
        type: document.getElementById("commType_Bajaji").value,
        value: Number(document.getElementById("commVal_Bajaji").value) || 500
      },
      Taxi: {
        type: document.getElementById("commType_Taxi").value,
        value: Number(document.getElementById("commVal_Taxi").value) || 15
      }
    };
    saveCommissionConfig(newConfig);
    showToast("✓ Commission settings updated successfully.");
  }

  // Subtab 8: Service Areas
  function renderAdminAreasTab(container) {
    const areas = getServiceAreas();

    container.innerHTML = `
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:18px; max-width:650px;">
        <h4 style="margin:0 0 8px 0; font-size:16px; color:#ffffff;">Active Transport Service Areas</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
          ${areas.map((a, idx) => `
            <span style="background:#1e293b; color:#38bdf8; border:1px solid #0369a1; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              📍 ${escapeHTML(a)}
              <button type="button" onclick="adminRemoveServiceArea(${idx})" style="background:transparent; border:none; color:#f87171; cursor:pointer; font-weight:800;">✕</button>
            </span>
          `).join('')}
        </div>
        <div style="display:flex; gap:8px;">
          <input id="adminNewAreaInput" type="text" placeholder="Enter new service area or landmark..." style="flex:1; background:#1e293b; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; font-size:12px;" />
          <button type="button" class="primary" onclick="adminAddServiceArea()" style="background:#0284c7; padding:8px 14px; font-size:12px; font-weight:700;">➕ Add Area</button>
        </div>
      </div>
    `;
  }

  function adminAddServiceArea() {
    const input = document.getElementById("adminNewAreaInput");
    const val = (input?.value || "").trim();
    if (!val) return;
    const areas = getServiceAreas();
    if (!areas.includes(val)) {
      areas.push(val);
      saveServiceAreas(areas);
      renderAdminAreasTab(document.getElementById("adminTransportTabContent"));
      showToast(`Added service area: ${val}`);
    }
    if (input) input.value = "";
  }

  function adminRemoveServiceArea(idx) {
    const areas = getServiceAreas();
    areas.splice(idx, 1);
    saveServiceAreas(areas);
    renderAdminAreasTab(document.getElementById("adminTransportTabContent"));
  }

  // -------------------------------------------------------------------------
  // ADMIN MODALS: ADD DRIVER (Admin-only) & ADD ROUTE
  // -------------------------------------------------------------------------
  function openAdminAddDriverModal() {
    const modal = document.getElementById("adminAddDriverModal");
    if (!modal) return;
    document.getElementById("adminDriverForm")?.reset();
    modal.style.display = "flex";
  }

  function closeAdminAddDriverModal() {
    const modal = document.getElementById("adminAddDriverModal");
    if (modal) modal.style.display = "none";
  }

  function handleAdminSubmitDriver(e) {
    if (e) e.preventDefault();
    const name = document.getElementById("drv_name")?.value.trim();
    const phone = document.getElementById("drv_phone")?.value.trim();
    const photo = document.getElementById("drv_photo")?.value.trim() || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80";
    const driverType = document.getElementById("drv_type")?.value;
    const vehicleReg = document.getElementById("drv_veh_reg")?.value.trim();
    const vehicleModel = document.getElementById("drv_veh_model")?.value.trim();
    const vehicleColor = document.getElementById("drv_veh_color")?.value.trim();
    const passengerCapacity = parseInt(document.getElementById("drv_capacity")?.value || "1", 10);
    const licenseNumber = document.getElementById("drv_license")?.value.trim();
    const licenseExpiry = document.getElementById("drv_expiry")?.value;
    const operatingArea = document.getElementById("drv_area")?.value.trim();
    const accountStatus = document.getElementById("drv_status")?.value || "Active";

    if (!name || !phone || !vehicleReg) {
      alert("Please fill required driver details.");
      return;
    }

    const newDriver = {
      id: "drv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name,
      phone,
      photo,
      driverType,
      vehicleReg,
      vehicleModel,
      vehicleColor,
      passengerCapacity,
      licenseNumber,
      licenseExpiry,
      operatingArea: operatingArea || "Arusha",
      verificationStatus: "Verified",
      accountStatus,
      isOnline: true,
      rating: 5.0,
      completedRides: 0,
      createdAt: new Date().toISOString()
    };

    const drivers = getDrivers();
    drivers.unshift(newDriver);
    saveDrivers(drivers);

    showToast(`✓ Driver ${name} registered and activated by Admin!`);
    closeAdminAddDriverModal();
    renderAdminDriversListTab(document.getElementById("adminTransportTabContent"));
    if (typeof renderAvailableDriversList === 'function') renderAvailableDriversList();
  }

  function adminToggleDriverStatus(driverId) {
    const drivers = getDrivers();
    const d = drivers.find(x => x.id === driverId);
    if (d) {
      d.accountStatus = (d.accountStatus === 'Active') ? 'Deactivated' : 'Active';
      saveDrivers(drivers);
      showToast(`Driver ${d.name} is now ${d.accountStatus}`);
      renderAdminDriversListTab(document.getElementById("adminTransportTabContent"));
    }
  }

  function adminDeleteDriver(driverId) {
    if (!confirm("Delete driver record?")) return;
    const drivers = getDrivers().filter(x => x.id !== driverId);
    saveDrivers(drivers);
    renderAdminDriversListTab(document.getElementById("adminTransportTabContent"));
  }

  // Admin Add Route
  function openAdminAddRouteModal() {
    const modal = document.getElementById("adminAddRouteModal");
    if (!modal) return;
    document.getElementById("adminRouteForm")?.reset();
    modal.style.display = "flex";
  }

  function closeAdminAddRouteModal() {
    const modal = document.getElementById("adminAddRouteModal");
    if (modal) modal.style.display = "none";
  }

  function handleAdminSubmitRoute(e) {
    if (e) e.preventDefault();
    const from = document.getElementById("rt_from")?.value.trim();
    const to = document.getElementById("rt_to")?.value.trim();
    const moto = parseFloat(document.getElementById("rt_moto_price")?.value);
    const bajaji = parseFloat(document.getElementById("rt_bajaji_price")?.value);
    const taxi = parseFloat(document.getElementById("rt_taxi_price")?.value);
    const bothWays = document.getElementById("rt_both_ways")?.checked !== false;

    if (!from || !to || isNaN(moto) || isNaN(bajaji) || isNaN(taxi)) {
      alert("Please enter valid route names and prices for all 3 transport types.");
      return;
    }

    const newRoute = {
      id: "rt_" + Date.now(),
      from,
      to,
      motorcyclePrice: moto,
      bajajiPrice: bajaji,
      taxiPrice: taxi,
      active: true,
      samePriceBothDirections: bothWays,
      serviceArea: "Arusha"
    };

    const routes = getRoutes();
    routes.push(newRoute);
    saveRoutes(routes);

    showToast(`✓ Fixed Route "${from} ➔ ${to}" created!`);
    closeAdminAddRouteModal();
    renderAdminRoutesTab(document.getElementById("adminTransportTabContent"));
    renderRouteSelector();
  }

  function adminToggleRouteActive(routeId) {
    const routes = getRoutes();
    const r = routes.find(x => x.id === routeId);
    if (r) {
      r.active = !r.active;
      saveRoutes(routes);
      renderAdminRoutesTab(document.getElementById("adminTransportTabContent"));
      renderRouteSelector();
    }
  }

  function adminDeleteRoute(routeId) {
    if (!confirm("Delete this route?")) return;
    const routes = getRoutes().filter(x => x.id !== routeId);
    saveRoutes(routes);
    renderAdminRoutesTab(document.getElementById("adminTransportTabContent"));
    renderRouteSelector();
  }

  // Global Exports
  window.getDrivers = getDrivers;
  window.getRoutes = getRoutes;
  window.getRides = getRides;
  window.getCommissionConfig = getCommissionConfig;
  window.handleCustomerRouteChange = handleCustomerRouteChange;
  window.selectCustomerRideType = selectCustomerRideType;
  window.selectCustomerDriver = selectCustomerDriver;
  window.createCustomerRideRequest = createCustomerRideRequest;
  window.closeCustomerActiveRideModal = closeCustomerActiveRideModal;
  window.cancelCustomerRide = cancelCustomerRide;
  window.renderDriverSimulator = renderDriverSimulator;
  window.switchSimulatedDriver = switchSimulatedDriver;
  window.toggleDriverOnlineStatus = toggleDriverOnlineStatus;
  window.driverAcceptRide = driverAcceptRide;
  window.driverDeclineRide = driverDeclineRide;
  window.advanceRideStatus = advanceRideStatus;
  window.renderAdminTransportDashboard = renderAdminTransportDashboard;
  window.switchAdminTransportSubtab = switchAdminTransportSubtab;
  window.openAdminAddDriverModal = openAdminAddDriverModal;
  window.closeAdminAddDriverModal = closeAdminAddDriverModal;
  window.handleAdminSubmitDriver = handleAdminSubmitDriver;
  window.adminToggleDriverStatus = adminToggleDriverStatus;
  window.adminDeleteDriver = adminDeleteDriver;
  window.openAdminAddRouteModal = openAdminAddRouteModal;
  window.closeAdminAddRouteModal = closeAdminAddRouteModal;
  window.handleAdminSubmitRoute = handleAdminSubmitRoute;
  window.adminToggleRouteActive = adminToggleRouteActive;
  window.adminDeleteRoute = adminDeleteRoute;
  window.handleSaveCommission = handleSaveCommission;
  window.adminAddServiceArea = adminAddServiceArea;
  window.adminRemoveServiceArea = adminRemoveServiceArea;
  window.initCustomerRideBookingUI = initCustomerRideBookingUI;

  // Auto initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCustomerRideBookingUI();
    });
  } else {
    initCustomerRideBookingUI();
  }
})();
