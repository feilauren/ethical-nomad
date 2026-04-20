import { useState, useEffect } from "react";
import { LoginGate } from "./components/LoginGate";
import { Header } from "./components/Header";
import { ExploreTab } from "./components/ExploreTab";
import { FlightsTab } from "./components/FlightsTab";
import { CountryModal } from "./components/CountryModal";
import { useLists } from "./hooks/useLists";

const FAVS_KEY    = "en-favs";
const SESSION_KEY = "en-session";

function loadFavs() {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY)) ?? []; } catch { return []; }
}

export default function App() {
  const [tab,       setTab]       = useState("explore");
  const [favorites, setFavorites] = useState(loadFavs);
  const [session,   setSession]   = useState(null);
  const [modal,     setModal]     = useState(null); // country object | null

  const listsApi = useLists();

  // Persist favorites
  useEffect(() => {
    try { localStorage.setItem(FAVS_KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  function toggleFav(name) {
    setFavorites((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function handleSignOut() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  return (
    <LoginGate session={session} onLogin={setSession} onSignOut={handleSignOut}>
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Header
          tab={tab}
          setTab={setTab}
          favCount={favorites.length}
          session={session}
          onSignOut={handleSignOut}
        />

        {tab === "explore" && (
          <ExploreTab
            favorites={favorites}
            toggleFav={toggleFav}
            listsApi={listsApi}
            onOpenModal={setModal}
          />
        )}

        {tab === "flights" && (
          <FlightsTab
            lists={listsApi.lists}
            listsApi={listsApi}
          />
        )}

        {modal && (
          <CountryModal
            c={modal}
            onClose={() => setModal(null)}
            favorites={favorites}
            toggleFav={toggleFav}
            listsApi={listsApi}
          />
        )}
      </div>
    </LoginGate>
  );
}
