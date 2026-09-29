import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../Firebase/firebase";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to store user profile in Firestore
  const createUserProfile = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        role: "user",
      });
    }
  };

  // Email & Password Auth (Login or Register)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(res.user);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found") setError("No account found with this email. Try signing up!");
      else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") setError("Invalid email or password.");
      else if (err.code === "auth/email-already-in-use") setError("An account already exists with this email.");
      else if (err.code === "auth/weak-password") setError("Password should be at least 6 characters.");
      else setError("Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Google Provider Auth
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await createUserProfile(res.user);
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError("Failed to authenticate with Google. Check Firebase Console settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-sm border border-zinc-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-xl mx-auto mb-3">
            B
          </div>
          <h1 className="text-2xl font-black text-black">
            {isSignUp ? "Create Account" : "Sign In"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Brownside Custom Apparel Management
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-zinc-200 hover:bg-zinc-50 font-semibold text-sm transition text-zinc-700 mb-4 disabled:opacity-50"
        >
          <FcGoogle size={20} />
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-zinc-200"></div>
          <span className="px-3 text-[11px] uppercase font-bold text-zinc-400">or email</span>
          <div className="flex-1 border-t border-zinc-200"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Log In"}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-xs font-semibold text-zinc-500 hover:text-black transition"
          >
            {isSignUp ? (
              <>Already have an account? <span className="text-orange-500 font-bold">Log In</span></>
            ) : (
              <>Don't have an account? <span className="text-orange-500 font-bold">Sign Up</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}