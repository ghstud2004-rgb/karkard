
export const calculateDuration = (start: string, end: string): string => {
  if (!start || !end) return "00:00";
  
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let totalStartMinutes = startH * 60 + startM;
  let totalEndMinutes = endH * 60 + endM;
  
  // Handle overnight shift if necessary (though usually not for daily forms)
  if (totalEndMinutes < totalStartMinutes) {
    totalEndMinutes += 24 * 60;
  }
  
  const diffMinutes = totalEndMinutes - totalStartMinutes;
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
