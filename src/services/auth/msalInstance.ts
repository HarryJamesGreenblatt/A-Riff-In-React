import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../../config/authConfig";

// Create a PublicClientApplication instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize the MSAL instance
export const initializeMsal = async () => {
  try {
    await msalInstance.initialize();
    
    // Handle redirect promise
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      console.log("Redirect response:", response);
      // Account selection logic can go here
      msalInstance.setActiveAccount(response.account);
    }
    
    // Set active account if there's one in the cache
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  } catch (error) {
    console.error("MSAL initialization error:", error);
  }
};
