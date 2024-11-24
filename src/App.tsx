import { useState, createContext } from "react";
import "./App.css";
import Auth from "./components/Auth";
import TravelCostCalculator from "./components/TravelCostCalculator";
import supabase from "./lib/createClient";
import { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { GroupMember } from "./lib/types";
import Navbar from "./components/Navbar";
import AllExpensesParent from "./components/AllExpenses/AllExpensesParent";
import { Toaster } from "./components/ui/toaster";

const SessionContext = createContext<Session | null>(null);

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  // check if session is already logged in
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
      } else if (session) {
        setSession(session);
      }
    });

    async function loadGroupMembers() {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      setGroupMembers(
        data.map((member) => ({
          id: member.id,
          full_name: member.full_name,
          email: member.email,
        }))
      );
    }
    loadGroupMembers();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const locations = ["Madrid", "Lisbon", "Porto", "Other"];
  const categories = [
    "Food",
    "Transportation",
    "Accommodation",
    "Entertainment",
    "Other",
  ];

  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <SessionContext.Provider value={session}>
        {session ? (
          <>
            <Navbar
              setIsLoading={setIsLoading}
              fullName={session.user.user_metadata.full_name || ""}
            />
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
              <TravelCostCalculator
                groupMembers={groupMembers}
                locations={locations}
                categories={categories}
                session={session}
              />
            </div>
            <AllExpensesParent />
          </>
        ) : (
          <Auth setIsLoading={setIsLoading} isLoading={isLoading} />
        )}
      </SessionContext.Provider>
      <Toaster /> {/* Add this line */}
    </>
  );
}

export default App;
