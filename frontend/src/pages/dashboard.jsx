import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl leading-tight text-sb-text m-0 mb-2">
        Dashboard
      </h1>
      <p className="text-sb-white text-[1.1rem] m-0 mb-2">
        Welcome, <strong>{user?.name ?? user?.email}</strong>.
      </p>
      <p className="text-sb-muted m-0">
        This is a protected area. You're signed in.
      </p>
    </div>
  );
}
