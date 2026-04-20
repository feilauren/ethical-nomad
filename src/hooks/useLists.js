import { useReducer, useEffect } from "react";
import { initialLists, saveLists } from "../utils/listStorage";

function reducer(state, action) {
  switch (action.type) {
    case "CREATE_LIST": {
      return [
        ...state,
        {
          id: crypto.randomUUID(),
          name: action.name.trim() || "New List",
          createdAt: new Date().toISOString(),
          countries: [],
        },
      ];
    }
    case "DELETE_LIST":
      return state.filter((l) => l.id !== action.id);

    case "RENAME_LIST":
      return state.map((l) =>
        l.id === action.id ? { ...l, name: action.name.trim() || l.name } : l
      );

    case "ADD_COUNTRY":
      return state.map((l) =>
        l.id === action.listId && !l.countries.includes(action.country)
          ? { ...l, countries: [...l.countries, action.country] }
          : l
      );

    case "REMOVE_COUNTRY":
      return state.map((l) =>
        l.id === action.listId
          ? { ...l, countries: l.countries.filter((c) => c !== action.country) }
          : l
      );

    default:
      return state;
  }
}

export function useLists() {
  const [lists, dispatch] = useReducer(reducer, undefined, initialLists);

  // Persist every time lists changes
  useEffect(() => {
    saveLists(lists);
  }, [lists]);

  return {
    lists,
    createList:    (name)               => dispatch({ type: "CREATE_LIST", name }),
    deleteList:    (id)                 => dispatch({ type: "DELETE_LIST", id }),
    renameList:    (id, name)           => dispatch({ type: "RENAME_LIST", id, name }),
    addCountry:    (listId, country)    => dispatch({ type: "ADD_COUNTRY", listId, country }),
    removeCountry: (listId, country)    => dispatch({ type: "REMOVE_COUNTRY", listId, country }),

    /** True if country appears in any list */
    isInAnyList: (country) => lists.some((l) => l.countries.includes(country)),

    /** Lists that contain the country */
    getListsForCountry: (country) => lists.filter((l) => l.countries.includes(country)),
  };
}
