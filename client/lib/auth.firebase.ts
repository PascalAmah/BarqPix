// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./utils/firebase";
import { authApi } from "./api/auth";

// Sign up
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

  // Create user in backend
  await authApi.createUser(userCredential.user);

  return userCredential.user;
};

// Sign in
export const signin = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Get user data from backend
  const token = await userCredential.user.getIdToken();
  await authApi.getCurrentUser(token);

  return userCredential.user;
};

// Edit user
export const editUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");

  await updateProfile(user, updates);

  // Update user in backend
  const token = await user.getIdToken();
  await authApi.updateUser(token, updates);

  return user;
};

// Reset password
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};
