import { storage } from "./storage";
import { db } from "./db";
import { notifications, activities } from "@shared/schema";
import { eq } from "drizzle-orm";

const MINI_APPS = [
  {
    id: "transit",
    name: "CityMove",
    description: "Real-time bus, train, and subway arrivals. View live departures, track vehicles, and plan your commute.",
    icon: "CityMoveIcon",
    color: "#4CAF50",
    category: "transit",
    url: "/mini-apps/transit.html",
    permissions: ["AUTH_CODE", "LOCATION"],
    allowedOrigins: ["*"],
    intents: ["FIND_TRANSIT", "CHECK_ARRIVALS", "PLAN_COMMUTE"],
    version: "2.1.0",
    developer: "CityMove Transit",
  },
  {
    id: "parking",
    name: "SpotHero",
    description: "Find available parking near you. Compare rates, check availability, and navigate to open spots.",
    icon: "SpotHeroIcon",
    color: "#1A73E8",
    category: "parking",
    url: "/mini-apps/parking.html",
    permissions: ["AUTH_CODE", "LOCATION"],
    allowedOrigins: ["*"],
    intents: ["FIND_PARKING", "RESERVE_SPOT", "CHECK_RATES"],
    version: "1.4.2",
    developer: "SpotHero Parking",
  },
  {
    id: "travel",
    name: "Travel Hub",
    description: "Check-in to flights, view boarding passes, and track flight status. Your travel companion.",
    icon: "Plane",
    color: "#8B5CF6",
    category: "travel",
    url: "/mini-apps/travel.html",
    permissions: ["AUTH_CODE"],
    allowedOrigins: ["*"],
    intents: ["CHECK_FLIGHT", "FLIGHT_CHECKIN", "SEARCH_FLIGHTS"],
    version: "3.0.1",
    developer: "SkyBridge Travel",
  },
  {
    id: "moviestream",
    name: "StreamFlix",
    description: "Stream movies and TV shows. Browse by genre, manage your watchlist, and get personalized recommendations.",
    icon: "StreamFlixIcon",
    color: "#000000",
    category: "entertainment",
    url: "/mini-apps/moviestream.html",
    permissions: ["AUTH_CODE"],
    allowedOrigins: ["*"],
    intents: ["BROWSE_MOVIES", "WATCH_CONTENT", "MANAGE_WATCHLIST"],
    version: "4.2.0",
    developer: "StreamFlix Media",
  },
  {
    id: "streamtv",
    name: "StreamTV",
    description: "Watch trending videos, subscribe to channels, and discover content across music, gaming, news, and more.",
    icon: "StreamTVIcon",
    color: "#FF0000",
    category: "entertainment",
    url: "/mini-apps/streamtv.html",
    permissions: ["AUTH_CODE"],
    allowedOrigins: ["*"],
    intents: ["WATCH_VIDEO", "BROWSE_CHANNELS", "SEARCH_CONTENT"],
    version: "5.1.3",
    developer: "VideoNet Labs",
  },
  {
    id: "showtix",
    name: "TicketHub",
    description: "Browse movies in theaters, pick showtimes, choose seats, and buy tickets. Your movie night starts here.",
    icon: "TicketHubIcon",
    color: "#410099",
    category: "entertainment",
    url: "/mini-apps/showtix.html",
    permissions: ["AUTH_CODE", "LOCATION"],
    allowedOrigins: ["*"],
    intents: ["FIND_SHOWTIMES", "BUY_TICKETS", "BROWSE_THEATERS"],
    version: "2.8.1",
    developer: "TicketHub Events",
  },
  {
    id: "megamart",
    name: "Bullseye Mart",
    description: "Shop top deals across electronics, home, clothing, and grocery. Find stores near you and get order updates.",
    icon: "BullseyeMartIcon",
    color: "#CC0000",
    category: "shopping",
    url: "/mini-apps/megamart.html",
    permissions: ["AUTH_CODE", "LOCATION"],
    allowedOrigins: ["*"],
    intents: ["SHOP_PRODUCTS", "FIND_DEALS", "TRACK_ORDER"],
    version: "3.5.0",
    developer: "Bullseye Mart Digital",
  },
  {
    id: "quickshop",
    name: "PrimeCart",
    description: "Find deals, browse categories, and track deliveries. Fast shopping with next-day delivery on millions of items.",
    icon: "PrimeCartIcon",
    color: "#232F3E",
    category: "shopping",
    url: "/mini-apps/quickshop.html",
    permissions: ["AUTH_CODE"],
    allowedOrigins: ["*"],
    intents: ["SHOP_DEALS", "TRACK_DELIVERY", "BROWSE_PRODUCTS"],
    version: "6.0.2",
    developer: "PrimeCart Corp",
  },
  {
    id: "valuestore",
    name: "SparkMart",
    description: "Everyday low prices on grocery, electronics, pharmacy, and more. Order for pickup or delivery from your local store.",
    icon: "SparkMartIcon",
    color: "#0071CE",
    category: "shopping",
    url: "/mini-apps/valuestore.html",
    permissions: ["AUTH_CODE", "LOCATION"],
    allowedOrigins: ["*"],
    intents: ["SHOP_GROCERIES", "FIND_STORE", "ORDER_PICKUP"],
    version: "4.1.0",
    developer: "SparkMart Tech",
  },
];

const DEMO_NOTIFICATIONS = [
  {
    miniAppId: "parking",
    title: "Parking Expiring Soon",
    body: "Your parking session at Downtown Garage (Level 2, Spot B14) expires in 15 minutes. Tap to extend or navigate to your vehicle.",
    data: { type: "expiration_warning", lotName: "Downtown Garage", spot: "B14", expiresIn: "15 min" },
    hoursAgo: 0.5,
  },
  {
    miniAppId: "transit",
    title: "Service Alert: Line 7",
    body: "Line 7 is experiencing delays of 10-15 minutes due to signal maintenance between Central and Park stations. Consider alternate routes.",
    data: { type: "service_alert", line: "7", delay: "10-15 min" },
    hoursAgo: 1,
  },
  {
    miniAppId: "travel",
    title: "Flight AA 1234 — Check-in Open",
    body: "Online check-in is now open for your flight AA 1234 (JFK → LAX). Departure: Tomorrow 8:30 AM. Tap to check in and get your boarding pass.",
    data: { type: "checkin_open", flight: "AA 1234", route: "JFK → LAX", departure: "Tomorrow 8:30 AM" },
    hoursAgo: 2,
  },
  {
    miniAppId: "parking",
    title: "Payment Confirmed",
    body: "Payment of $12.50 confirmed for Riverside Lot. Session valid until 6:00 PM. Receipt has been saved to your account.",
    data: { type: "payment_confirmed", lotName: "Riverside Lot", amount: "$12.50", validUntil: "6:00 PM" },
    hoursAgo: 5,
  },
  {
    miniAppId: "travel",
    title: "Gate Change — Flight UA 789",
    body: "Your flight UA 789 (SFO → ORD) has been moved to Gate B22. Boarding starts at 3:15 PM. Please proceed to the new gate.",
    data: { type: "gate_change", flight: "UA 789", newGate: "B22", boarding: "3:15 PM" },
    hoursAgo: 8,
  },
  {
    miniAppId: "transit",
    title: "Trip Complete",
    body: "Your CityMove trip on Route 42 Express has ended. Duration: 28 min. Fare charged: $2.75. Have a great day!",
    data: { type: "trip_complete", route: "42 Express", duration: "28 min", fare: "$2.75" },
    hoursAgo: 24,
  },
  {
    miniAppId: "moviestream",
    title: "New Release: Galactic Odyssey",
    body: "The sci-fi epic 'Galactic Odyssey' is now streaming on StreamFlix. Add it to your watchlist or start watching now!",
    data: { type: "new_release", title: "Galactic Odyssey", genre: "Sci-Fi" },
    hoursAgo: 3,
  },
  {
    miniAppId: "streamtv",
    title: "New Upload from TechReviews",
    body: "TechReviews just uploaded: 'Best Gadgets of 2026 — Full Roundup'. Watch now before it trends!",
    data: { type: "new_upload", channel: "TechReviews", videoTitle: "Best Gadgets of 2026" },
    hoursAgo: 1.5,
  },
  {
    miniAppId: "showtix",
    title: "Booking Confirmed — 2 Tickets",
    body: "Your TicketHub tickets for 'Midnight Run' at Cinema City, Screen 4, 7:30 PM are confirmed. Seats: F7, F8. Show your QR code at entry.",
    data: { type: "booking_confirmed", movie: "Midnight Run", theater: "Cinema City", seats: "F7, F8" },
    hoursAgo: 4,
  },
  {
    miniAppId: "megamart",
    title: "Flash Sale: Electronics 30% Off",
    body: "Bullseye Mart: Headphones, tablets, and smart home devices are 30% off for the next 6 hours. Shop now!",
    data: { type: "flash_sale", department: "Electronics", discount: "30%" },
    hoursAgo: 2,
  },
  {
    miniAppId: "quickshop",
    title: "Your Order Has Shipped",
    body: "PrimeCart Order #PC-884291 is on its way! Estimated delivery: Tomorrow by 8 PM. Track your package for live updates.",
    data: { type: "order_shipped", orderId: "PC-884291", eta: "Tomorrow by 8 PM" },
    hoursAgo: 6,
  },
  {
    miniAppId: "valuestore",
    title: "Pickup Ready at Store #1247",
    body: "Your SparkMart grocery order is ready for pickup at Store #1247 (Main St). Head to the Pickup area and show your code: SM-7734.",
    data: { type: "pickup_ready", storeId: "1247", code: "SM-7734" },
    hoursAgo: 0.5,
  },
];

export async function seedDatabase() {
  try {
    for (const app of MINI_APPS) {
      await storage.createMiniApp(app);
    }
    console.log(`Seeded ${MINI_APPS.length} mini-apps`);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

const DEMO_ACTIVITIES = [
  {
    miniAppId: "transit",
    title: "Bus 502: Arriving in 3 mins",
    body: "CityMove — Next stop: Central Station. On time.",
    icon: "bus",
    data: { route: "502", eta: "3 min" },
    ttlHours: 1,
  },
  {
    miniAppId: "parking",
    title: "Spot B14 expires in 15 min",
    body: "SpotHero — Downtown Garage, Level 2. Tap to extend.",
    icon: "parking",
    data: { spot: "B14", lot: "Downtown Garage" },
    ttlHours: 0.5,
  },
  {
    miniAppId: "moviestream",
    title: "Continue: Galactic Odyssey",
    body: "StreamFlix — You left off at 1:23:45. Resume watching now.",
    icon: "play",
    data: { title: "Galactic Odyssey", progress: "1:23:45" },
    ttlHours: 24,
  },
  {
    miniAppId: "megamart",
    title: "Flash Sale: 30% off Electronics",
    body: "Bullseye Mart — Headphones, tablets & smart home — 6 hours left.",
    icon: "sale",
    data: { department: "Electronics", discount: "30%" },
    ttlHours: 6,
  },
  {
    miniAppId: "quickshop",
    title: "Order #PC-884291 Out for Delivery",
    body: "PrimeCart — Estimated arrival: Today by 8 PM.",
    icon: "truck",
    data: { orderId: "PC-884291", eta: "Today by 8 PM" },
    ttlHours: 12,
  },
  {
    miniAppId: "valuestore",
    title: "Pickup Ready — Store #1247",
    body: "SparkMart — Your grocery order is ready. Code: SM-7734.",
    icon: "store",
    data: { storeId: "1247", code: "SM-7734" },
    ttlHours: 4,
  },
];

export async function seedActivities() {
  try {
    const existing = await storage.getActivities();
    if (existing.length > 0) return;

    for (const a of DEMO_ACTIVITIES) {
      const expiresAt = new Date(Date.now() + a.ttlHours * 60 * 60 * 1000);
      await db.insert(activities).values({
        miniAppId: a.miniAppId,
        title: a.title,
        body: a.body,
        icon: a.icon,
        data: a.data,
        expiresAt,
      });
    }
    console.log(`Seeded ${DEMO_ACTIVITIES.length} demo activities`);
  } catch (error) {
    console.error("Error seeding activities:", error);
  }
}

export async function seedNotifications(userId: string) {
  try {
    const existing = await storage.getNotifications(userId);
    if (existing.length > 0) return;

    for (const n of DEMO_NOTIFICATIONS) {
      const createdAt = new Date(Date.now() - n.hoursAgo * 60 * 60 * 1000);
      await db.insert(notifications).values({
        userId,
        miniAppId: n.miniAppId,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.hoursAgo > 6,
        createdAt,
      });
    }
    console.log(`Seeded ${DEMO_NOTIFICATIONS.length} demo notifications for user ${userId}`);
  } catch (error) {
    console.error("Error seeding notifications:", error);
  }
}
