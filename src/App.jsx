import { useState } from "react";
import { LoginGate } from "./components/LoginGate";
import { Header } from "./components/Header";
import { ExploreTab } from "./components/ExploreTab";
import { FlightsTab } from "./components/FlightsTab";
import { SchengenTab } from "./components/SchengenTab";
import { NotesTab } from "./components/NotesTab";
import { CountryModal } from "./components/CountryModal";
import { useLists } from "./hooks/useLists";
import { useSchengen } from "./hooks/useSchengen";
import { useNotes } from "./hooks/useNotes";

const SESSION_KEY = "en-session";

export default function App() {
  const [tab,     setTab]     = useState("explore");
  const [session, setSession] = useState(null);
  const [modal,   setModal]   = useState(null); // country object | null

  const listsApi    = useLists();
  const schengenApi = useSchengen(session);
  const notesApi    = useNotes(session);

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
          session={session}
          onSignOut={handleSignOut}
        />

        {tab === "explore" && (
          <ExploreTab
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

        {tab === "schengen" && (
          <SchengenTab schengenApi={schengenApi} />
        )}

        {tab === "notes" && (
          <NotesTab notesApi={notesApi} lists={listsApi.lists} />
        )}

        {modal && (
          <CountryModal
            c={modal}
            onClose={() => setModal(null)}
            listsApi={listsApi}
          />
        )}
      </div>
    </LoginGate>
  );
}
