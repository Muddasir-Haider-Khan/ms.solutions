# Design System: MS Solutions (Amazon-Inspired)

## 1. Visual Theme & Atmosphere

Our application leverages the world-class, conversion-proven design principles of Amazon.com. The interface aims for unparalleled clarity, high information density, and maximum trust. Unlike "trendy" dark-mode aesthetics, this design system is stark, bright, and deeply functional. We operate on almost exclusively light surfaces, allowing product imagery, prices, and clear calls-to-action (CTAs) to stand out against high-contrast, structured containers.

Our MS brand logo—featuring a strong Blue foundation overlaid with an energetic Orange swoosh—perfectly mirrors Amazon's core aesthetic (Navy Blue + Amazon Orange). We use depth logically; shadows indicate physical interactivity, borders frame information precisely, and typography prioritizes immediate legibility over stylistic flourish.

**Key Characteristics:**
- White-first background strategy (`#FFFFFF` and `#F2F2F2`) to maximize product visibility.
- Dense, data-rich layouts utilizing strict 1px gray borders to separate content blocks.
- Navy Blue (`#232F3E`) exclusively reserved for primary navigation headers and footers to sandwich the white content.
- MS Orange (`#FF9900`) for primary interactive CTAs (e.g., "Add to Cart", "Buy Now") and important system notifications.
- Heavy reliance on standard system fonts (Arial, Helvetica, sans-serif) to ensure zero typographic loading latency and absolute familiarity.
- Strict use of "Yellow-Orange" gradients for primary action buttons to create a faux-3D 'clickable' affordance.

## 2. Color Palette & Roles

### Functional Base Layer
- **Page Background:** Off-White Gray (`#EAEDED`) or `#F2F2F2` – Used behind individual white cards/containers to create subtle separation.
- **Surface Level 1:** Pure White (`#FFFFFF`) – Used for all product cards, article bodies, and checkout forms.

### Primary Accents (The MS/Amazon Identity)
- **Header Navy Blue:** `#131921` (Darkest) and `#232F3E` (Standard Navy) – The primary brand containers for the top navigation bar and footer.
- **MS Brand Orange:** `#FF9900` – Used for primary focus elements, star ratings, and major CTAs.
- **Link Blue:** `#007185` – All secondary clickable text elements (e.g., "See all details"). Turns red/orange on hover.
- **Hover Red/Orange (Links):** `#C45500` – Used exclusively for hovering over Link Blues and indicating active states or critical text (e.g., low stock warnings).

### Interface CTAs (Buttons)
- **Primary Action Flow (Add To Cart):** Gradient top `#F8E3AD`, bottom `#EEBA37` with a 1px solid border `#A88734 #9C7E31 #846A29`.
- **Secondary Action Flow (Buy Now):** Solid bright orange-yellow `#FFA41C` with border `#FF8F00`.
- **Tertiary Action (Default Gray):** Gradient top `#F7F8FA`, bottom `#E7E9EC` with a solid border `#ADB1B8 #A2A6AC #8D9096`. (For structural buttons like "Back" or "Cancel").

### Data Defaults (Text & Borders)
- **Primary Text:** `#0F1111` – Almost true black for headers and body text.
- **Secondary Text (Subdued):** `#565959` – Gray text for meta-information, dates, or minor attributes.
- **Interface Borders:** `#D5D9D9` – Standard 1px border for table rows, inputs, and separating product sections.
- **Success Green:** `#007600` – Used explicitly and only for success messaging: "In Stock."
- **Alert Red:** `#B12704` – Used explicitly and only for warnings: "Only 1 left in stock."

## 3. Typography Rules

### Font Family
Amazon's philosophy eschews custom web fonts in favor of OS-native typography. We prioritize legibility and performance above all.
**Base Font Stack:** `Arial, sans-serif` (Fallbacks: `Helvetica, -apple-system, BlinkMacSystemFont`)

### Hierarchy
- **Header 1 (Page Title):** 24px - 28px | Normal (400) | Line Height 1.2
- **Header 2 (Section Title):** 20px - 24px | Bold (700) | Line Height 1.3
- **Header 3 (Card Title):** 16px - 18px | Bold (700) | Line Height 1.3
- **Product Title (PDP):** 24px | Normal (400) | Line Height 1.3 | Text Color: `#0F1111`
- **Link Text:** 14px - 16px | Normal (400) | Text Color: `#007185` | Hover: `underline #C45500`
- **Body Regular:** 14px | Normal (400) | Line Height 1.5 | Text Color: `#0F1111`
- **Body Small:** 12px | Normal (400) | Line Height 1.5 | Text Color: `#565959`
- **Price Primary:** 28px (Dollars) + 14px (Cents Superscript) | Normal (400) | Text Color: `#B12704` or `#0F1111`.

### Principles
- **Density over Airiness:** Line heights are tighter than standard modern SaaS. Text is densely packed to minimize scrolling to present maximum information above the fold. 
- **High Contrast Only:** No faint gray text meant to be 'stylish'. If it's on screen, it requires high contrast.

## 4. Component Stylings

### Buttons
**Primary Buy Button (Add to Cart)**
- Background: `#FFD814`
- Text: `#0F1111`
- Border: 1px solid `#FCD200`
- Border-radius: 100px (Pill shape) - Note: Amazon shifted to full pills for core CTAs recently.
- Hover: `#F7CA00` (Slightly darker yellow)
- Box Shadow: `0 2px 5px rgba(15,17,17,.15)`

**Secondary Buy Button (Buy Now)**
- Background: `#FFA41C`
- Text: `#0F1111`
- Border: 1px solid `#FF8F00`
- Border-radius: 100px (Pill shape)
- Hover: `#FA8900`
- Box Shadow: `0 2px 5px rgba(15,17,17,.15)`

**Ghost / Normal Button**
- Background: `#FFFFFF`
- Text: `#0F1111`
- Border: 1px solid `#D5D9D9`
- Border-radius: 8px or 100px depending on context.
- Hover: `#F7FAFA`

### Inputs & Forms
- Background: `#FFFFFF`
- Border: 1px solid `#888C8C` (Strong dark gray to indicate interaction area)
- BorderRadius: 3px (Sharp, utilitarian)
- Padding: 6px 10px
- Focus: 3px box-shadow glow using `#007185` at 50% opacity.
- Border on Focus: 1px solid `#007185`.

### Product Cards
- Background: `#FFFFFF`
- Padding: 16px (Variable, but usually tightly packed)
- Border: None (when placed on `#EAEDED` background, the card shapes itself) OR
- Shadow (Hover state): `0px 4px 8px rgba(0,0,0,0.1)` on hover to indicate interact-ability.

### Header Navigation
- Background: `#131921` (Navy Blue)
- Text Color: `#FFFFFF`
- Interactive Elements (Search bar, Account link, Cart): Display a 1px solid transparent border that turns `#FFFFFF` purely on hover (The "Amazon Box Hover").
- Search Bar: Centered, massive, taking up max available width. Has a dropdown for departments on the left (gray bg), white text input in the middle, and an Orange `#FEBD69` search button on the right.

### The "Buy Box" (Product Detail Right Column)
- Background: `#FFFFFF`
- Border: 1px solid `#D5D9D9`
- Border Radius: 8px
- Padding: 18px
- Content: Contains Price, Stock Status (Green/Red), "Deliver To" link, Quantity Select, Add to Cart, Buy Now.
- Spacing: Internally tight.

## 5. Layout Principles

### Spacing System
Base unit is fundamentally unstructured but generally follows a tight 4px or 8px grid logic. We will standardize to Tailwind's 4px unit system.
- `gap-1` to `gap-4` for internal item spacing (dense).
- Sections are divided by harsh lines or gray backgrounds rather than empty white space.

### Desktop vs Mobile Strategy
**Desktop:** Tends to favor 3 or 4 column grid layouts for products. The "Buy Box" sits fixed on the right sidebar on product detail pages. Filters sit on the left sidebar.
**Mobile:** Full width panels stacked vertically. The "Buy Box" floats above the fold temporarily and pins to the bottom on scroll. High touch-target sizes required for inputs.

## 6. Do's and Don'ts

### Do
- Use white space only if necessary. A dense UI is expected.
- Utilize Link Blue `#007185` for all textual links and ensure they underline on hover.
- Make the Search Bar the most dominant horizontal element in the header.
- Use explicit `#007600` for POSITIVE states ("In Stock") and `#B12704` for NEGATIVE states ("Out of Stock", Errors, Price cuts).
- Use pill shapes (`rounded-full`) exclusively for core checkout CTAs, leaving all other buttons `rounded-sm` or `rounded-md`.

### Don't
- Don't use dark themes. Our interfaces sit purely on `#FFFFFF` cards atop `#EAEDED` canvas colors.
- Don't use large, airy padding strategies unless directly referencing an Amazon aesthetic norm.
- Don't round standard image containers; images should mostly be flush or have sharp crisp borders (`rounded-none` or `rounded-sm` maximum).
- Don't use animated hover effects (framers, transitions). Interactivity should feel instantaneous (CSS `:hover` with no transition duration is preferred).
- Don't deviate from standard OS font stacks. Legibility > Branding.

## 7. Migration Notes (From Dark Mode)
We are migrating to this Amazon-styled design system. 
1. `globals.css` must have its background reset to `#EAEDED` or `#FFFFFF`.
2. Delete dark-mode toggle components; this is a strictly light-mode experience.
3. Overwrite any Shadcn UI defaults that enforce dark mode or use primary colors outside the UI color palette listed above.
