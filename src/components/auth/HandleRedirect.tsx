import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { store } from "../../store";
import { setCurrentUser, usersApi } from "../../features/users/slice";
import type { AuthenticationResult } from "@azure/msal-browser";

export const HandleRedirect = () => {
  const { instance } = useMsal();

  useEffect(() => {
    instance
      .handleRedirectPromise()
      .then((response: AuthenticationResult | null) => {
        if (response && response.account) {
          const entraUser = response.account;
          instance.setActiveAccount(entraUser);

          // This is the logic that was previously in signIn()
          store.dispatch(usersApi.endpoints.createUser.initiate({
            name: entraUser.name,
            email: entraUser.username,
          }))
          .unwrap()
          .then((backendUser) => {
            store.dispatch(setCurrentUser(backendUser));
          })
          .catch((error: unknown) => {
            if (error && typeof error === 'object' && 'status' in error && error.status === 409 && entraUser.username) {
              console.warn("User already exists, fetching existing user data.");
              store.dispatch(usersApi.endpoints.getUserByEmail.initiate(entraUser.username))
                .unwrap()
                .then((existingUser) => {
                  store.dispatch(setCurrentUser(existingUser));
                });
            } else {
              console.error("MSAL sign-in error after redirect:", error);
            }
          });
        }
      })
      .catch((error) => {
        console.error("MSAL redirect handling error:", error);
      });
  }, [instance]);

  return null; // This component does not render anything
};
