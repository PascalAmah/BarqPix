import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./utils/firebase";
import { authApi } from "./api/auth";

let tokenRefreshTimeout: NodeJS.Timeout;

const setupTokenRefresh = (user: any) => {
  if (tokenRefreshTimeout) {
    clearTimeout(tokenRefreshTimeout);
  }

  const refreshToken = async () => {
    try {
      const newToken = await user.getIdToken(true);
      const storedUser = localStorage.getItem("barqpix_user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.token = newToken;
        localStorage.setItem("barqpix_user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  };

  const expiresIn = 60 * 60 * 1000; // 1 hour in milliseconds
  tokenRefreshTimeout = setTimeout(refreshToken, expiresIn - 5 * 60 * 1000);
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    setupTokenRefresh(user);
  } else {
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
    }
  }
});

export const signup = async (
  email: string,
  password: string,
  displayName?: string
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  await authApi.createUser(userCredential.user);

  return userCredential.user;
};

export const signin = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const token = await userCredential.user.getIdToken();
  await authApi.getCurrentUser(token);

  setupTokenRefresh(userCredential.user);

  return {
    user: userCredential.user,
    token,
  };
};

export const editUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");

  await updateProfile(user, updates);

  const token = await user.getIdToken();
  await authApi.updateUser(token, updates);

  return user;
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};
