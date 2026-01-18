# linkstats

![dashboard](public/dashboard.png)

linkstats is a modern dashboard to help see statistics for when you and your friends have hung out. Just a fun project to familiarize myself with working with shadcn components, tailwind and supabase as a backend.


## Features

###  Interactive Dashboard
The dashboard contains multiple charts and graphs to help visualize the dat including all-time hangouts, average duration and special per-person awards.

### Location Mapping
-   **Interactive Map**: Visualize where hangouts occur on a dark-themed map.
-   **Significant Locations**:
    -   Custom labeling for frequent spots (e.g., "Rami's House" instead of the raw address).
    -   **Add/Edit/Delete**: Full management of these custom location aliases directly from the UI.
    -   **Badges**: Clean badges replace long addresses in history lists and map tooltips.

###  Link History & Management
![cards](public/card.png)
-   **Comprehensive History**: sortable and filterable list of all past events.
-   **Easy Logging**: "Add Link" modal to quickly record a new hangout with:
    -   Date, Time, Duration
    -   Purpose/Activity
    -   Location (with auto-complete and map integration)
    -   Attendees & "Floppers" (those who bailed)
-   **Edit Capabilities**: Fully editable history to correct any details.

## ⚡ Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/link-dashboard.git
    cd link-dashboard
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open the app**:
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

