import React, { createContext, useState, useContext } from 'react';

const ReactionPickerContext = createContext();

export const ReactionPickerProvider = ({ children }) => {
  const [activePickerMessageId, setActivePickerMessageId] = useState(null);

  // Show a reaction picker for a specific message and hide any others
  const showReactionPicker = (messageId) => {
    setActivePickerMessageId(messageId);
  };

  // Hide all reaction pickers
  const hideAllReactionPickers = () => {
    setActivePickerMessageId(null);
  };

  return (
    <ReactionPickerContext.Provider
      value={{
        activePickerMessageId,
        showReactionPicker,
        hideAllReactionPickers,
      }}
    >
      {children}
    </ReactionPickerContext.Provider>
  );
};

export const useReactionPicker = () => useContext(ReactionPickerContext);
