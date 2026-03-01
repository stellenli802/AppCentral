export type RouteResult =
  | { type: "mini-app"; appId: string; label: string; description: string }
  | { type: "external"; provider: string; label: string; description: string; deepLink: string; webFallback: string }
  | { type: "action"; label: string; description: string; appId: string; mode: string };

export type IntentResult = {
  intent: string;
  actions: RouteResult[];
  miniApps: RouteResult[];
  external: RouteResult[];
};

const KEYWORD_ROUTES: { keywords: string[]; result: RouteResult }[] = [
  {
    keywords: ["bus", "train", "subway", "transit", "commute", "metro", "arrivals", "departures"],
    result: { type: "mini-app", appId: "transit", label: "CityMove", description: "View live arrivals & departures" },
  },
  {
    keywords: ["parking", "park", "garage", "lot", "spot"],
    result: { type: "mini-app", appId: "parking", label: "SpotHero", description: "Find nearby parking spots" },
  },
  {
    keywords: ["flight", "airline", "check-in", "checkin", "boarding", "travel", "airport"],
    result: { type: "mini-app", appId: "travel", label: "Travel Hub", description: "Check-in & boarding passes" },
  },
  {
    keywords: ["uber", "lyft", "ride", "taxi", "cab"],
    result: {
      type: "external",
      provider: "Uber",
      label: "Uber",
      description: "Request a ride via Uber",
      deepLink: "uber://",
      webFallback: "https://m.uber.com",
    },
  },
  {
    keywords: ["food", "restaurant", "eat", "dining", "yelp", "review"],
    result: {
      type: "external",
      provider: "Yelp",
      label: "Yelp",
      description: "Find restaurants & reviews",
      deepLink: "yelp://",
      webFallback: "https://www.yelp.com/search",
    },
  },
  {
    keywords: ["hotel", "stay", "booking", "expedia", "vacation", "trip"],
    result: {
      type: "external",
      provider: "Expedia",
      label: "Expedia",
      description: "Search hotels & vacation deals",
      deepLink: "expedia://",
      webFallback: "https://www.expedia.com",
    },
  },
  {
    keywords: ["movie", "film", "watch", "stream", "netflix", "series", "show", "binge"],
    result: { type: "mini-app", appId: "moviestream", label: "StreamFlix", description: "Stream movies & TV shows" },
  },
  {
    keywords: ["video", "youtube", "channel", "subscribe", "vlog", "clip", "trending"],
    result: { type: "mini-app", appId: "streamtv", label: "StreamTV", description: "Watch trending videos & channels" },
  },
  {
    keywords: ["ticket", "showtime", "cinema", "theater", "fandango", "screening", "matinee"],
    result: { type: "mini-app", appId: "showtix", label: "TicketHub", description: "Browse showtimes & buy tickets" },
  },
  {
    keywords: ["target", "deal", "sale", "electronics", "home goods", "clothing"],
    result: { type: "mini-app", appId: "megamart", label: "Bullseye Mart", description: "Shop deals on electronics, home & more" },
  },
  {
    keywords: ["amazon", "order", "delivery", "package", "prime", "buy online", "shop online"],
    result: { type: "mini-app", appId: "quickshop", label: "PrimeCart", description: "Fast shopping with next-day delivery" },
  },
  {
    keywords: ["walmart", "grocery", "pickup", "pharmacy", "rollback", "low price"],
    result: { type: "mini-app", appId: "valuestore", label: "SparkMart", description: "Everyday low prices & store pickup" },
  },
  {
    keywords: ["shop", "shopping", "buy", "purchase", "store"],
    result: { type: "mini-app", appId: "megamart", label: "Bullseye Mart", description: "Shop deals on electronics, home & more" },
  },
  {
    keywords: ["entertain", "entertainment", "fun", "tonight", "weekend"],
    result: { type: "mini-app", appId: "moviestream", label: "StreamFlix", description: "Stream movies & TV shows" },
  },
];

const QUICK_ACTIONS: { keywords: string[]; result: RouteResult }[] = [
  {
    keywords: ["parking near", "find parking", "spot near", "nearby parking"],
    result: { type: "action", label: "Find parking near me", description: "Opens SpotHero in nearby mode", appId: "parking", mode: "nearby" },
  },
  {
    keywords: ["bus near", "next bus", "arrivals near", "next train"],
    result: { type: "action", label: "Next bus arrivals", description: "View live CityMove departures", appId: "transit", mode: "nearby" },
  },
  {
    keywords: ["check-in", "checkin", "flight status", "boarding pass"],
    result: { type: "action", label: "Check flight status", description: "View flight status & check-in", appId: "travel", mode: "checkin" },
  },
  {
    keywords: ["book hotel", "find hotel", "hotel near"],
    result: { type: "action", label: "Book a hotel", description: "Search hotels on Expedia", appId: "travel", mode: "hotels" },
  },
  {
    keywords: ["order food", "get food", "food delivery", "order dinner"],
    result: { type: "action", label: "Order food nearby", description: "Find restaurants on Yelp", appId: "", mode: "external-yelp" },
  },
  {
    keywords: ["get ride", "call ride", "need ride", "request ride"],
    result: { type: "action", label: "Request a ride", description: "Open Uber for a ride", appId: "", mode: "external-uber" },
  },
  {
    keywords: ["watch movie", "find movie", "stream movie", "movie night"],
    result: { type: "action", label: "Find a movie to watch", description: "Browse movies on StreamFlix", appId: "moviestream", mode: "browse" },
  },
  {
    keywords: ["buy ticket", "movie ticket", "get ticket", "book seats"],
    result: { type: "action", label: "Buy movie tickets", description: "Find showtimes on TicketHub", appId: "showtix", mode: "showtimes" },
  },
  {
    keywords: ["watch video", "trending video", "find video"],
    result: { type: "action", label: "Watch trending videos", description: "Browse trending on StreamTV", appId: "streamtv", mode: "trending" },
  },
  {
    keywords: ["shop deal", "find deal", "today deal", "best deal"],
    result: { type: "action", label: "Browse today's deals", description: "Find deals on PrimeCart", appId: "quickshop", mode: "deals" },
  },
  {
    keywords: ["order grocery", "buy grocery", "grocery delivery", "grocery pickup"],
    result: { type: "action", label: "Order groceries", description: "Shop groceries on SparkMart", appId: "valuestore", mode: "grocery" },
  },
  {
    keywords: ["track order", "track package", "where order", "delivery status"],
    result: { type: "action", label: "Track your order", description: "Check delivery status on PrimeCart", appId: "quickshop", mode: "tracking" },
  },
];

export function routeQuery(query: string): IntentResult {
  if (!query.trim()) return { intent: "", actions: [], miniApps: [], external: [] };
  const q = query.toLowerCase();
  const actions: RouteResult[] = [];
  const miniApps: RouteResult[] = [];
  const external: RouteResult[] = [];
  const seen = new Set<string>();

  for (const qa of QUICK_ACTIONS) {
    for (const keyword of qa.keywords) {
      if (q.includes(keyword)) {
        const key = qa.result.label;
        if (!seen.has(key)) {
          seen.add(key);
          actions.push(qa.result);
        }
        break;
      }
    }
  }

  for (const route of KEYWORD_ROUTES) {
    for (const keyword of route.keywords) {
      if (q.includes(keyword)) {
        const r = route.result;
        const key = r.type === "mini-app" ? r.appId : r.type === "external" ? r.provider : r.label;
        if (!seen.has(key)) {
          seen.add(key);
          if (r.type === "mini-app") miniApps.push(r);
          else if (r.type === "external") external.push(r);
        }
        break;
      }
    }
  }

  const intent = actions.length > 0 ? "action" : miniApps.length > 0 ? "app" : external.length > 0 ? "external" : "none";

  return { intent, actions, miniApps, external };
}

export function openExternalService(provider: { deepLink: string; webFallback: string }) {
  const timeout = setTimeout(() => {
    window.open(provider.webFallback, "_blank");
  }, 500);

  const handleBlur = () => {
    clearTimeout(timeout);
    window.removeEventListener("blur", handleBlur);
  };
  window.addEventListener("blur", handleBlur);

  window.location.href = provider.deepLink;
}
