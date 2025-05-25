import Papa from 'papaparse';

/**
 * Loads the VIP list from the CSV file
 * @returns {Promise<Array>} - Array of VIP objects with name and roll number
 */
export const loadVIPList = async () => {
  try {
    const response = await fetch('/insiderList.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch VIP list: ${response.status}`);
    }
    
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { 
      header: true, 
      skipEmptyLines: true,
      dynamicTyping: true,
      delimitersToGuess: [',', '\t', '|', ';']
    });
    
    // Map data and ensure proper formatting
    return parsed.data.map(row => ({
      name: row.Name ? row.Name.trim().toLowerCase() : '',
      roll: row.RollNumber ? row.RollNumber.trim() : ''
    }));
  } catch (error) {
    console.error('Error loading VIP list:', error);
    return [];
  }
};

/**
 * Checks if a user is a VIP based on name and roll number
 * @param {string} inputName - User's name
 * @param {string} inputRoll - User's roll number
 * @returns {Promise<boolean>} - True if user is a VIP, false otherwise
 */
export const isVIP = async (inputName, inputRoll) => {
  if (!inputName || !inputRoll) {
    return false;
  }
  
  const vipList = await loadVIPList();
  const formattedName = inputName.trim().toLowerCase();
  const formattedRoll = inputRoll.trim();
  
  // Check if user exists in VIP list
  return vipList.some(vip => 
    vip.name === formattedName && vip.roll === formattedRoll
  );
};

/**
 * Gets all VIPs with similar name or roll number for partial matching
 * @param {string} partialName - Partial name to search for
 * @param {string} partialRoll - Partial roll number to search for
 * @returns {Promise<Array>} - Array of matching VIP objects
 */
export const findSimilarVIPs = async (partialName = '', partialRoll = '') => {
  const vipList = await loadVIPList();
  
  if (!partialName && !partialRoll) {
    return [];
  }
  
  const formattedPartialName = partialName.trim().toLowerCase();
  const formattedPartialRoll = partialRoll.trim();
  
  return vipList.filter(vip => 
    (formattedPartialName && vip.name.includes(formattedPartialName)) ||
    (formattedPartialRoll && vip.roll.includes(formattedPartialRoll))
  );
};

/**
 * Retrieves the full VIP list for authorized users
 * @returns {Promise<Array>} - Complete VIP list
 */
export const getFullVIPList = async () => {
  return await loadVIPList();
};