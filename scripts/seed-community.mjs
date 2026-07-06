// One-off migration: seed the `communityPosts` Firestore collection from the
// data that used to live hardcoded in anveshan-recipes/src/data/community-posts.ts.
//
// Idempotent: existing docs are left untouched (so like/save/share counts and
// any admin edits survive re-runs). Only missing docs are created.
//
// Usage: node scripts/seed-community.mjs
// Requires FIREBASE_SERVICE_ACCOUNT (or GOOGLE_APPLICATION_CREDENTIALS).

import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

// Auto-load .env.local so the script works without manually exporting the credential.
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* rely on ambient environment */
}

function loadCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    return cert(JSON.parse(json));
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) return cert(JSON.parse(readFileSync(path, "utf8")));
  return applicationDefault();
}

// Related food image by keyword (LoremFlickr, locked seed = stable across reloads).
const img = (keyword, lock) =>
  `https://loremflickr.com/1080/1920/${encodeURIComponent(keyword)}?lock=${lock}`;
const pics = (keyword, base, count) =>
  Array.from({ length: count }, (_, i) => img(keyword, base + i));

const POSTS = [
  { id: "cp01", title: "Khapli Atta Banana Pancakes", description: "Fluffy banana pancakes, zero maida 🥞\n\nRecipe:\n• Mash 2 ripe bananas + 1 cup Anveshan Khapli Atta + ½ cup milk + a spoon of honey.\n• Rest 5 min, cook on Anveshan Ghee till golden.\nHigh-fibre & kid-approved!", author: "Ananya Rao", handle: "@ananyacooks", date: "Jun 28, 2026", images: pics("pancakes", 101, 3), tags: ["breakfast", "highfibre", "kids"], products: ["khapli-atta", "ghee", "honey"], likes: 486 },
  { id: "cp02", title: "Turmeric Latte Chia Pudding", description: "Golden overnight chia 🍵\n\nRecipe:\n• Mix 3 tbsp chia + 1 cup milk + 1 tsp Anveshan Turmeric Latte + honey.\n• Chill overnight, top with fruit.\nAnti-inflammatory breakfast, done.", author: "Vikram Menon", handle: "@vik.eats", date: "Jun 24, 2026", images: pics("pudding", 201, 2), tags: ["mealprep", "antiinflammatory"], products: ["turmeric-latte-mix", "honey"], likes: 331 },
  { id: "cp03", title: "Sesame Oil Garlic Noodles", description: "15-min nutty garlic noodles 🍜\n\nRecipe:\n• Toss boiled noodles in 2 tbsp Anveshan Black Sesame Oil + lots of garlic, soy & chilli.\n• Finish with spring onion.\nWeeknight saviour.", author: "Priya Nair", handle: "@priyainthekitchen", date: "Jun 20, 2026", images: pics("noodles", 301, 1), tags: ["quick", "vegan"], products: ["sesame-oil"], likes: 402 },
  { id: "cp04", title: "Jaggery Peanut Butter Cups", description: "No-sugar PB cups 🍫\n\nRecipe:\n• Melt dark chocolate with a little Anveshan Groundnut Oil.\n• Fill with peanut butter + Anveshan Jaggery Powder.\n• Set in freezer 20 min.", author: "Rahul Deshmukh", handle: "@rahulbakes", date: "Jun 15, 2026", images: pics("chocolate", 401, 2), tags: ["dessert", "nosugar"], products: ["jaggery-powder", "groundnut-oil"], likes: 458 },
  { id: "cp05", title: "Saffron Almond Milkshake", description: "Kesar badam shake 🥛\n\nRecipe:\n• Blend soaked almonds + milk + honey + a few Anveshan Saffron strands.\n• Serve chilled.\nFestive in a glass.", author: "Sneha Iyer", handle: "@snehasips", date: "Jun 11, 2026", images: pics("milkshake", 501, 1), tags: ["drinks", "festive"], products: ["saffron", "honey"], likes: 377 },
  { id: "cp06", title: "Coconut Oil Granola Bars", description: "Chewy granola bars 🥣\n\nRecipe:\n• Mix oats + nuts, bind with Anveshan Coconut Oil, honey & Anveshan Jaggery.\n• Press & bake 18 min.\nGrab-and-go snack.", author: "Arjun Kapoor", handle: "@arjun.fit", date: "Jun 6, 2026", images: pics("granola", 601, 3), tags: ["snack", "mealprep"], products: ["coconut-oil", "honey", "jaggery-powder"], likes: 290 },
  { id: "cp07", title: "Khapli Chocolate Muffins", description: "Guilt-free cocoa muffins 🧁\n\nRecipe:\n• 1½ cups Anveshan Khapli Atta + cocoa + Anveshan Jaggery.\n• Add milk + Anveshan Ghee, bake 20 min.\nMoist & rich.", author: "Meera Joshi", handle: "@meerabakes", date: "May 31, 2026", images: pics("muffin", 701, 2), tags: ["dessert", "baking"], products: ["khapli-atta", "ghee", "jaggery-powder"], likes: 344 },
  { id: "cp08", title: "Olive Oil Lemon Herb Hummus", description: "Silky hummus 🫓\n\nRecipe:\n• Blend chickpeas + tahini + lemon + garlic.\n• Swirl generously with Anveshan Extra-Virgin Olive Oil.\nScoop everything.", author: "Karan Malhotra", handle: "@karan.plates", date: "May 26, 2026", images: pics("hummus", 801, 1), tags: ["dip", "vegan"], products: ["olive-oil"], likes: 268 },
  { id: "cp09", title: "Mustard Oil Street Aloo Chaat", description: "Smoky aloo chaat 🥔\n\nRecipe:\n• Crisp boiled potatoes in Anveshan Mustard Oil.\n• Toss with chaat masala, onion & chutneys.\nStreet-style at home.", author: "Divya Reddy", handle: "@divyachaat", date: "May 20, 2026", images: pics("chaat", 901, 2), tags: ["streetfood", "chaat"], products: ["mustard-oil"], likes: 471 },
  { id: "cp10", title: "Amlaprash Energy Balls", description: "Immunity bites ⚡\n\nRecipe:\n• Blend dates + nuts + 2 tbsp Anveshan Amlaprash + Anveshan Dry Fruit Paak.\n• Roll into balls, chill.\nNo bake, all good.", author: "Aditya Sharma", handle: "@aditya.wellness", date: "May 14, 2026", images: pics("ladoo", 1001, 1), tags: ["immunity", "nobake"], products: ["amlaprash", "dry-fruit-paak"], likes: 312 },
  { id: "cp11", title: "Ghee Roasted Makhana Mix", description: "Crunchy trail mix 🌰\n\nRecipe:\n• Roast makhana in Anveshan Ghee till crisp.\n• Toss with Anveshan Dry Fruit Paak & seeds.\n4pm snack sorted.", author: "Nisha Verma", handle: "@nishasnacks", date: "May 9, 2026", images: pics("makhana", 1101, 2), tags: ["snack", "roasted"], products: ["ghee", "dry-fruit-paak"], likes: 359 },
  { id: "cp12", title: "Sunflower Oil Veggie Tempura", description: "Crispy veggie tempura 🍤\n\nRecipe:\n• Dip veggies in a light batter.\n• Fry in Anveshan Sunflower Oil till golden.\nStays crisp, not greasy.", author: "Rohan Gupta", handle: "@rohanfries", date: "May 3, 2026", images: pics("tempura", 1201, 1), tags: ["fried", "veggies"], products: ["sunflower-oil"], likes: 285 },
  { id: "cp13", title: "Ashwagandha Moon Milk", description: "Bedtime moon milk 🌙\n\nRecipe:\n• Warm milk + 1 tsp Anveshan Ashwagandha Mix + honey + a pinch of nutmeg.\n• Sip & unwind.\nBetter-sleep ritual.", author: "Kavya Pillai", handle: "@kavya.calm", date: "Apr 27, 2026", images: pics("goldenmilk", 1301, 2), tags: ["drinks", "sleep"], products: ["ashwagandha-mix", "honey"], likes: 421 },
  { id: "cp14", title: "Khandsari Caramel Popcorn", description: "Caramel popcorn 🍿\n\nRecipe:\n• Pop corn in Anveshan Coconut Oil.\n• Coat in melted Anveshan Khandsari caramel.\nMovie-night upgrade.", author: "Sameer Khanna", handle: "@sameersnacks", date: "Apr 21, 2026", images: pics("caramelpopcorn", 1401, 1), tags: ["snack", "sweet"], products: ["khandsari", "coconut-oil"], likes: 344 },
  { id: "cp15", title: "Multigrain Veggie Crackers", description: "Baked veggie crackers 🥨\n\nRecipe:\n• Knead Anveshan Multigrain Atta with grated veggies + Anveshan Sesame Oil.\n• Roll thin, bake till crisp.", author: "Tara Bhatt", handle: "@tarabakes", date: "Apr 15, 2026", images: pics("crackers", 1501, 2), tags: ["baking", "snack"], products: ["multigrain-atta", "sesame-oil"], likes: 301 },
  { id: "cp16", title: "Honey Ginger Immunity Shots", description: "2-ingredient wellness shots 🍯\n\nRecipe:\n• Mix raw Anveshan Honey with fresh ginger juice + lemon.\n• Down it every morning.", author: "Manav Sethi", handle: "@manav.wellness", date: "Apr 9, 2026", images: pics("lemonade", 1601, 1), tags: ["immunity", "quick"], products: ["honey"], likes: 264 },
  { id: "cp17", title: "Dry Fruit Paak Stuffed Dates", description: "Festive stuffed dates 🌴\n\nRecipe:\n• Pit Medjool dates.\n• Stuff with Anveshan Dry Fruit Paak, top with pistachio.\n5-min mithai.", author: "Ishita Chawla", handle: "@ishita.treats", date: "Apr 3, 2026", images: pics("medjool", 1701, 2), tags: ["festive", "nobake"], products: ["dry-fruit-paak"], likes: 389 },

  { id: "cp18", title: "Soft Khapli Kulche", description: "Fluffy kulche, no maida 🫓\n\nRecipe:\n• Knead Anveshan Khapli Atta with yogurt & a pinch of soda.\n• Roast on tawa, brush with Anveshan Ghee.", author: "Pooja Shetty", handle: "@poojacooks", date: "Apr 1, 2026", images: pics("naan", 1800, 2), tags: ["bread", "northindian"], products: ["khapli-atta", "ghee"], likes: 421 },
  { id: "cp19", title: "Ghee Gulab Jamun", description: "Melt-in-mouth jamun 🍯\n\nRecipe:\n• Fry khoya balls in Anveshan Ghee till golden.\n• Soak in Anveshan Jaggery syrup.", author: "Aman Trivedi", handle: "@aman.eats", date: "Mar 29, 2026", images: pics("gulabjamun", 1810, 2), tags: ["dessert", "festive"], products: ["ghee", "jaggery-powder"], likes: 489 },
  { id: "cp20", title: "Saffron Veg Biryani", description: "Fragrant dum biryani 🍚\n\nRecipe:\n• Layer rice & veggies, drizzle Anveshan Ghee.\n• Finish with Anveshan Saffron milk, dum 15 min.", author: "Ritika Sharma", handle: "@ritika.kitchen", date: "Mar 26, 2026", images: pics("biryani", 1820, 2), tags: ["rice", "festive"], products: ["ghee", "saffron"], likes: 476 },
  { id: "cp21", title: "Mumbai Vada Pav", description: "Iconic vada pav 🥔\n\nRecipe:\n• Fry spiced potato vada in Anveshan Groundnut Oil.\n• Pack in pav with chutneys.", author: "Sahil Bansal", handle: "@sahilbites", date: "Mar 23, 2026", images: pics("vadapav", 1830, 2), tags: ["streetfood", "mumbai"], products: ["groundnut-oil", "khapli-atta"], likes: 452 },
  { id: "cp22", title: "Crispy Samosa", description: "Golden flaky samosa 🔺\n\nRecipe:\n• Stuff Anveshan Khapli Atta dough with masala aloo.\n• Deep-fry in Anveshan Groundnut Oil.", author: "Neha Kulkarni", handle: "@nehacooks", date: "Mar 20, 2026", images: pics("samosa", 1840, 2), tags: ["streetfood", "snack"], products: ["groundnut-oil", "khapli-atta"], likes: 468 },
  { id: "cp23", title: "Garlic Butter Naan", description: "Soft garlic naan 🧄\n\nRecipe:\n• Knead Anveshan Khapli Atta with curd.\n• Cook on tawa, slather Anveshan Ghee + garlic.", author: "Varun Rao", handle: "@varun.tandoor", date: "Mar 17, 2026", images: pics("naan", 1850, 1), tags: ["bread", "tandoor"], products: ["khapli-atta", "ghee"], likes: 411 },
  { id: "cp24", title: "Tandoori Butter Roti", description: "Smoky butter roti 🔥\n\nRecipe:\n• Roll Anveshan Khapli Atta dough.\n• Char on tawa, brush with Anveshan Ghee.", author: "Anjali Mehta", handle: "@anjalibakes", date: "Mar 14, 2026", images: pics("roti", 1860, 1), tags: ["bread", "tandoor"], products: ["khapli-atta", "ghee"], likes: 356 },
  { id: "cp25", title: "Moong Dal Chilla", description: "Protein moong chilla 🟡\n\nRecipe:\n• Blend soaked moong dal into a batter.\n• Cook on Anveshan Ghee, stuff with paneer.", author: "Deepak Nair", handle: "@deepak.plates", date: "Mar 11, 2026", images: pics("chilla", 1870, 1), tags: ["breakfast", "protein"], products: ["ghee"], likes: 378 },
  { id: "cp26", title: "Besan Chilla", description: "Quick besan chilla 🍳\n\nRecipe:\n• Whisk besan with veggies & spices.\n• Pan-fry in Anveshan Groundnut Oil.", author: "Simran Kaur", handle: "@simran.kitchen", date: "Mar 8, 2026", images: pics("chilla", 1880, 1), tags: ["breakfast", "quick"], products: ["groundnut-oil"], likes: 333 },
  { id: "cp27", title: "Clear Vegetable Soup", description: "Cozy veggie soup 🥣\n\nRecipe:\n• Simmer mixed veggies with pepper.\n• Finish with a drizzle of Anveshan Olive Oil.", author: "Harsh Vardhan", handle: "@harsheats", date: "Mar 5, 2026", images: pics("soup", 1890, 1), tags: ["soup", "light"], products: ["olive-oil"], likes: 288 },
  { id: "cp28", title: "Paneer Kathi Roll", description: "Loaded paneer roll 🌯\n\nRecipe:\n• Make Anveshan Khapli Atta rotis.\n• Fill with tawa paneer cooked in Anveshan Ghee.", author: "Pallavi Jain", handle: "@pallavicooks", date: "Mar 2, 2026", images: pics("wrap", 1900, 2), tags: ["wrap", "lunch"], products: ["khapli-atta", "ghee"], likes: 434 },
  { id: "cp29", title: "Rainbow Veggie Wrap", description: "Fresh veggie wrap 🥗\n\nRecipe:\n• Warm an Anveshan Multigrain Atta wrap.\n• Fill with hummus, veggies & Anveshan Olive Oil.", author: "Rohit Saxena", handle: "@rohit.wraps", date: "Feb 27, 2026", images: pics("wrap", 1910, 1), tags: ["wrap", "healthy"], products: ["multigrain-atta", "olive-oil"], likes: 401 },
  { id: "cp30", title: "Veg Manchurian", description: "Saucy manchurian 🥢\n\nRecipe:\n• Fry veggie balls, toss in soy-chilli sauce.\n• Temper in Anveshan Sesame Oil.", author: "Ayesha Khan", handle: "@ayesha.eats", date: "Feb 24, 2026", images: pics("manchurian", 1920, 1), tags: ["indochinese", "dinner"], products: ["sesame-oil", "sunflower-oil"], likes: 419 },
  { id: "cp31", title: "Litti Chokha", description: "Smoky baingan chokha 🍆\n\nRecipe:\n• Roast & mash brinjal, tomato, garlic.\n• Temper with raw Anveshan Mustard Oil.", author: "Nikhil Rana", handle: "@nikhilcooks", date: "Feb 21, 2026", images: pics("curry", 1930, 1), tags: ["bihari", "rustic"], products: ["mustard-oil"], likes: 322 },
  { id: "cp32", title: "Dahi Tadka Dal", description: "Creamy dahi tadka 🍲\n\nRecipe:\n• Simmer dal with yogurt.\n• Pour a sizzling Anveshan Ghee tadka.", author: "Shreya Ghosh", handle: "@shreya.tadka", date: "Feb 18, 2026", images: pics("dal", 1940, 1), tags: ["dal", "comfort"], products: ["ghee"], likes: 388 },
  { id: "cp33", title: "One-Pot Khichdi", description: "Comfort khichdi 🍚\n\nRecipe:\n• Pressure-cook rice, moong dal & veggies.\n• Top with a spoon of Anveshan Ghee.", author: "Kunal Roy", handle: "@kunalkhichdi", date: "Feb 15, 2026", images: pics("khichdi", 1950, 1), tags: ["comfort", "onepot"], products: ["ghee"], likes: 407 },
  { id: "cp34", title: "Lehsun Chutney", description: "Fiery garlic chutney 🌶️\n\nRecipe:\n• Grind garlic, red chilli & roasted peanuts.\n• Bloom in Anveshan Groundnut Oil.", author: "Aarti Singh", handle: "@aarti.chutney", date: "Feb 12, 2026", images: pics("chutney", 1960, 1), tags: ["condiment", "spicy"], products: ["groundnut-oil"], likes: 297 },
  { id: "cp35", title: "Ragi Mudde", description: "Wholesome ragi mudde 🟤\n\nRecipe:\n• Cook ragi flour into soft balls.\n• Serve with dal & Anveshan Ghee.", author: "Girish Hegde", handle: "@girish.ragi", date: "Feb 9, 2026", images: pics("ragi", 1970, 1), tags: ["southindian", "highfibre"], products: ["ghee"], likes: 344 },
  { id: "cp36", title: "Steamed Khaman", description: "Spongy khaman 🟡\n\nRecipe:\n• Steam besan batter till fluffy.\n• Temper with Anveshan Groundnut Oil, mustard & curry leaves.", author: "Bhavna Patel", handle: "@bhavnabakes", date: "Feb 6, 2026", images: pics("dhokla", 1980, 1), tags: ["gujarati", "snack"], products: ["groundnut-oil"], likes: 411 },
  { id: "cp37", title: "Ker Sangri ki Sabji", description: "Marwari ker sangri 🌵\n\nRecipe:\n• Soak ker & sangri, sauté with spices.\n• Cook in Anveshan Mustard Oil, finish with Anveshan Ghee.", author: "Mahesh Rathore", handle: "@mahesh.marwari", date: "Feb 3, 2026", images: pics("curry", 1990, 1), tags: ["rajasthani", "traditional"], products: ["mustard-oil", "ghee"], likes: 366 },
  { id: "cp38", title: "Malai Mirch", description: "Creamy malai mirch 🌶️\n\nRecipe:\n• Stuff big chillies with a malai-spice mix.\n• Shallow-cook in Anveshan Ghee.", author: "Ishaan Verma", handle: "@ishaancooks", date: "Jan 31, 2026", images: pics("curry", 2000, 1), tags: ["sidedish", "rich"], products: ["ghee"], likes: 289 },
  { id: "cp39", title: "Dry Fruit Baklava", description: "Flaky honey baklava 🍯\n\nRecipe:\n• Layer filo with Anveshan Dry Fruit Paak & Anveshan Ghee.\n• Bake, soak in Anveshan Honey syrup.", author: "Farah Sheikh", handle: "@farah.sweets", date: "Jan 28, 2026", images: pics("baklava", 2010, 2), tags: ["dessert", "festive"], products: ["honey", "ghee", "dry-fruit-paak"], likes: 472 },
  { id: "cp40", title: "Indori Poha", description: "Fluffy indori poha 🍚\n\nRecipe:\n• Sauté poha with onion & spices in Anveshan Groundnut Oil.\n• Top with sev & pomegranate.", author: "Ankit Dubey", handle: "@ankit.poha", date: "Jan 25, 2026", images: pics("poha", 2020, 1), tags: ["breakfast", "indore"], products: ["groundnut-oil"], likes: 338 },
  { id: "cp41", title: "Puffy Puri", description: "Golden puffy puri 🫓\n\nRecipe:\n• Knead a stiff Anveshan Khapli Atta dough.\n• Deep-fry in Anveshan Groundnut Oil till puffed.", author: "Ritu Agarwal", handle: "@ritucooks", date: "Jan 22, 2026", images: pics("puri", 2030, 1), tags: ["bread", "festive"], products: ["khapli-atta", "groundnut-oil"], likes: 417 },
  { id: "cp42", title: "Masala Bhaat", description: "Spiced Maharashtrian bhaat 🍚\n\nRecipe:\n• Cook rice with veggies & goda masala.\n• Finish with Anveshan Ghee.", author: "Sanjay Kale", handle: "@sanjay.maharashtra", date: "Jan 19, 2026", images: pics("pulao", 2040, 1), tags: ["maharashtrian", "rice"], products: ["ghee"], likes: 351 },
  { id: "cp43", title: "Varan Bhaat", description: "Simple varan 🍲\n\nRecipe:\n• Cook toor dal with hing & jaggery.\n• Serve over rice with Anveshan Ghee.", author: "Meghna Desai", handle: "@meghnaeats", date: "Jan 16, 2026", images: pics("dal", 2050, 1), tags: ["comfort", "maharashtrian"], products: ["ghee"], likes: 302 },
  { id: "cp44", title: "Kesar Shrikhand", description: "Silky shrikhand 🥛\n\nRecipe:\n• Hang curd, whisk with Anveshan Jaggery.\n• Flavour with Anveshan Saffron & cardamom.", author: "Prerna Joshi", handle: "@prerna.mithai", date: "Jan 13, 2026", images: pics("yogurt", 2060, 1), tags: ["dessert", "festive"], products: ["saffron", "jaggery-powder"], likes: 443 },
  { id: "cp45", title: "Matar ka Nimona", description: "Green pea nimona 🟢\n\nRecipe:\n• Grind & roast green peas.\n• Simmer into a curry in Anveshan Mustard Oil.", author: "Vivek Mishra", handle: "@vivek.nimona", date: "Jan 10, 2026", images: pics("curry", 2070, 1), tags: ["uttarpradesh", "winter"], products: ["mustard-oil"], likes: 318 },
  { id: "cp46", title: "Lauki Kofte ki Sabji", description: "Melt-in-gravy kofte 🟠\n\nRecipe:\n• Fry lauki koftas, simmer in tomato gravy.\n• Cooked in Anveshan Mustard Oil, finished with Anveshan Ghee.", author: "Komal Yadav", handle: "@komalcooks", date: "Jan 7, 2026", images: pics("kofta", 2080, 1), tags: ["curry", "dinner"], products: ["mustard-oil", "ghee"], likes: 397 },
  { id: "cp47", title: "Malai Kofta", description: "Restaurant-style malai kofta 🤍\n\nRecipe:\n• Fry paneer koftas in Anveshan Sunflower Oil.\n• Simmer in a creamy gravy with Anveshan Ghee.", author: "Tarun Malhotra", handle: "@tarun.malai", date: "Jan 4, 2026", images: pics("curry", 2090, 2), tags: ["curry", "rich"], products: ["ghee", "sunflower-oil"], likes: 461 },
  { id: "cp48", title: "Bharwa Mirch ki Sabji", description: "Stuffed mirch sabji 🌶️\n\nRecipe:\n• Stuff chillies with a besan masala.\n• Slow-cook in Anveshan Mustard Oil.", author: "Sunita Chauhan", handle: "@sunita.mirch", date: "Dec 30, 2025", images: pics("curry", 2100, 1), tags: ["sidedish", "spicy"], products: ["mustard-oil"], likes: 284 },
  { id: "cp49", title: "Atta Momos", description: "Steamed atta momos 🥟\n\nRecipe:\n• Wrap veggies in Anveshan Khapli Atta dough.\n• Steam & serve with an Anveshan Sesame Oil chilli oil.", author: "Dev Kapoor", handle: "@dev.momos", date: "Dec 27, 2025", images: pics("momos", 2110, 2), tags: ["snack", "steamed"], products: ["khapli-atta", "sesame-oil"], likes: 429 },
  { id: "cp50", title: "Himachali Siddu", description: "Steamed siddu 🥔\n\nRecipe:\n• Stuff Anveshan Khapli Atta dough with a walnut-poppy mix.\n• Steam, serve with Anveshan Ghee.", author: "Himani Thakur", handle: "@himani.himachal", date: "Dec 24, 2025", images: pics("dumplings", 2120, 1), tags: ["himachali", "steamed"], products: ["khapli-atta", "ghee"], likes: 356 },
  { id: "cp51", title: "Shahi Tukda", description: "Royal shahi tukda 👑\n\nRecipe:\n• Fry bread in Anveshan Ghee.\n• Soak in rabdi with Anveshan Saffron & Anveshan Dry Fruit Paak.", author: "Zoya Ansari", handle: "@zoya.shahi", date: "Dec 21, 2025", images: pics("dessert", 2130, 2), tags: ["dessert", "mughlai"], products: ["ghee", "saffron", "dry-fruit-paak"], likes: 452 },
  { id: "cp52", title: "Sev Bhaji", description: "Khandeshi sev bhaji 🍜\n\nRecipe:\n• Make a spicy onion-tomato gravy.\n• Cook in Anveshan Groundnut Oil, top with sev.", author: "Rakesh Gupta", handle: "@rakesh.sev", date: "Dec 18, 2025", images: pics("curry", 2140, 1), tags: ["maharashtrian", "spicy"], products: ["groundnut-oil"], likes: 309 },
  { id: "cp53", title: "4-in-1 Paratha", description: "Four-fold stuffed paratha 🫓\n\nRecipe:\n• Layer 4 fillings in Anveshan Khapli Atta dough.\n• Roast crisp with Anveshan Ghee.", author: "Naina Kohli", handle: "@naina.paratha", date: "Dec 15, 2025", images: pics("paratha", 2150, 2), tags: ["breakfast", "stuffed"], products: ["khapli-atta", "ghee"], likes: 438 },
  { id: "cp54", title: "Veg Twister", description: "Crunchy veg twister 🌀\n\nRecipe:\n• Roll spiced veg in an Anveshan Khapli Atta sheet.\n• Fry crisp in Anveshan Sunflower Oil.", author: "Aditya Jain", handle: "@aditya.snacks", date: "Dec 12, 2025", images: pics("snack", 2160, 1), tags: ["snack", "party"], products: ["khapli-atta", "sunflower-oil"], likes: 323 },
  { id: "cp55", title: "Crispy Veg Fritters", description: "Extra-crispy fritters 🍤\n\nRecipe:\n• Coat veggies in a light batter.\n• Fry in Anveshan Sunflower Oil till crunchy.", author: "Isha Reddy", handle: "@isha.crispy", date: "Dec 9, 2025", images: pics("fritters", 2170, 1), tags: ["snack", "fried"], products: ["sunflower-oil"], likes: 291 },
  { id: "cp56", title: "Homemade French Fries", description: "Golden crispy fries 🍟\n\nRecipe:\n• Double-fry potato batons in Anveshan Sunflower Oil.\n• Toss with salt & herbs.", author: "Kabir Sethi", handle: "@kabir.fries", date: "Dec 6, 2025", images: pics("frenchfries", 2180, 1), tags: ["snack", "kids"], products: ["sunflower-oil"], likes: 402 },
  { id: "cp57", title: "Fresh Mint Chutney", description: "Zingy mint chutney 🌿\n\nRecipe:\n• Blend mint, coriander, chilli & roasted peanuts.\n• Loosen with Anveshan Groundnut Oil.", author: "Tanvi Rao", handle: "@tanvi.chutney", date: "Dec 3, 2025", images: pics("chutney", 2190, 1), tags: ["condiment", "fresh"], products: ["groundnut-oil"], likes: 360 },
  { id: "cp58", title: "Andhra Peanut Chutney", description: "Nutty peanut chutney 🥜\n\nRecipe:\n• Grind roasted peanuts with chilli & tamarind.\n• Temper in Anveshan Sesame Oil & Anveshan Groundnut Oil.", author: "Suresh Iyer", handle: "@suresh.peanut", date: "Nov 30, 2025", images: pics("chutney", 2200, 1), tags: ["southindian", "condiment"], products: ["groundnut-oil", "sesame-oil"], likes: 285 },
  { id: "cp59", title: "Smoky BBQ Sauce", description: "Sweet-smoky BBQ sauce 🍖\n\nRecipe:\n• Simmer tomato, spices & Anveshan Jaggery.\n• Add a dash of Anveshan Mustard Oil for depth.", author: "Alia Bhattacharya", handle: "@alia.grill", date: "Nov 27, 2025", images: pics("barbecue", 2210, 1), tags: ["sauce", "grill"], products: ["jaggery-powder", "mustard-oil"], likes: 431 },
  { id: "cp60", title: "Thai Green Curry", description: "Creamy thai green curry 🥥\n\nRecipe:\n• Simmer veggies in coconut milk & green paste.\n• Cook in Anveshan Coconut Oil.", author: "Rhea Fernandes", handle: "@rhea.thai", date: "Nov 24, 2025", images: pics("thaicurry", 2220, 2), tags: ["thai", "dinner"], products: ["coconut-oil"], likes: 377 },
  { id: "cp61", title: "Soya Chaap Masala", description: "Tandoori-style chaap 🍢\n\nRecipe:\n• Marinate chaap in curd & spices.\n• Grill, toss in gravy with Anveshan Mustard Oil & Anveshan Ghee.", author: "Manish Chopra", handle: "@manish.chaap", date: "Nov 21, 2025", images: pics("kebab", 2230, 2), tags: ["tandoor", "dinner"], products: ["mustard-oil", "ghee"], likes: 414 },
  { id: "cp62", title: "Coconut Dosa Chutney", description: "Classic dosa chutney 🥥\n\nRecipe:\n• Grind coconut, chana & chilli.\n• Temper in Anveshan Coconut Oil & Anveshan Sesame Oil.", author: "Lakshmi Menon", handle: "@lakshmi.dosa", date: "Nov 18, 2025", images: pics("dosa", 2240, 1), tags: ["southindian", "condiment"], products: ["coconut-oil", "sesame-oil"], likes: 346 },
  { id: "cp63", title: "Khapli Tea Biscuits", description: "Crunchy tea biscuits 🍪\n\nRecipe:\n• Mix Anveshan Khapli Atta with Anveshan Ghee.\n• Cut & bake till crisp.", author: "Gaurav Bhatt", handle: "@gaurav.bakes", date: "Nov 15, 2025", images: pics("biscuits", 2250, 1), tags: ["baking", "teatime"], products: ["khapli-atta", "ghee"], likes: 298 },
  { id: "cp64", title: "Jaggery Oat Cookies", description: "Chewy jaggery cookies 🍪\n\nRecipe:\n• Cream Anveshan Ghee with Anveshan Jaggery.\n• Fold oats & Anveshan Khapli Atta, bake.", author: "Nidhi Arora", handle: "@nidhi.cookies", date: "Nov 12, 2025", images: pics("cookies", 2260, 2), tags: ["baking", "nosugar"], products: ["khapli-atta", "jaggery-powder", "ghee"], likes: 439 },
  { id: "cp65", title: "Eggless Khapli Cake", description: "Moist eggless cake 🎂\n\nRecipe:\n• Batter Anveshan Khapli Atta with Anveshan Jaggery & curd.\n• Add Anveshan Ghee, bake 30 min.", author: "Sana Qureshi", handle: "@sana.cakes", date: "Nov 9, 2025", images: pics("cake", 2270, 2), tags: ["baking", "eggless"], products: ["khapli-atta", "ghee", "jaggery-powder"], likes: 468 },
  { id: "cp66", title: "Boondi Raita", description: "Cooling boondi raita 🥣\n\nRecipe:\n• Fry besan boondi in Anveshan Sunflower Oil.\n• Fold into spiced whisked curd.", author: "Om Prakash", handle: "@om.raita", date: "Nov 6, 2025", images: pics("raita", 2280, 1), tags: ["sidedish", "cooling"], products: ["sunflower-oil"], likes: 276 },
  { id: "cp67", title: "Masala Corn Chaat", description: "Buttery corn chaat 🌽\n\nRecipe:\n• Toss sweet corn in Anveshan Ghee & chaat masala.\n• Finish with lemon & onion.", author: "Diya Malhotra", handle: "@diya.cornchaat", date: "Nov 3, 2025", images: pics("corn", 2290, 1), tags: ["snack", "quick"], products: ["ghee"], likes: 352 },
];

initializeApp({ credential: loadCredential(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const db = getFirestore();

let created = 0;
let skipped = 0;
for (let i = 0; i < POSTS.length; i++) {
  const p = POSTS[i];
  const ref = db.collection("communityPosts").doc(p.id);
  if ((await ref.get()).exists) {
    skipped++;
    continue;
  }
  await ref.set({
    title: p.title,
    description: p.description,
    author: p.author,
    handle: p.handle,
    date: p.date,
    images: p.images,
    tags: p.tags,
    products: p.products,
    likes: p.likes,
    saves: 0,
    shares: 0,
    order: i,
    createdAt: FieldValue.serverTimestamp(),
  });
  created++;
}

console.log(`communityPosts seeded: ${created} created, ${skipped} already existed.`);
process.exit(0);
