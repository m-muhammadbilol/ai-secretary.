const sessionState = {
  turns: [],
  pendingInteraction: null,
};

function getAssistantContext() {
  return {
    turns: [...sessionState.turns],
    pendingInteraction: sessionState.pendingInteraction,
  };
}

function rememberTurn(entry) {
  sessionState.turns.push({
    user: entry.user || '',
    assistant: entry.assistant || '',
    action: entry.action || null,
    data: entry.data || {},
    createdAt: new Date().toISOString(),
  });

  if (sessionState.turns.length > 6) {
    sessionState.turns.splice(0, sessionState.turns.length - 6);
  }
}

function setPendingInteraction(interaction) {
  sessionState.pendingInteraction = {
    reason: interaction.reason || null,
    action: interaction.action || null,
    data: interaction.data || {},
    confirmationTarget: interaction.confirmationTarget || null,
    createdAt: new Date().toISOString(),
  };
}

function clearPendingInteraction() {
  sessionState.pendingInteraction = null;
}

module.exports = {
  getAssistantContext,
  rememberTurn,
  setPendingInteraction,
  clearPendingInteraction,
};
