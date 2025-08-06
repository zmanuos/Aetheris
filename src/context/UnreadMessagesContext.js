"use client"

import { createContext, useState, useContext } from "react"

const UnreadMessagesContext = createContext(null)

export const UnreadMessagesProvider = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)

  return (
    <UnreadMessagesContext.Provider value={{ totalUnreadCount, setTotalUnreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext)
  if (context === undefined) {
    throw new Error("useUnreadMessages must be used within an UnreadMessagesProvider")
  }
  return context
}