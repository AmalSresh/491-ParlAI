import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Support() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issueType: 'Bug Report',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.nickname || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please describe the issue.';
    }

    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    console.log('Submitted support ticket:', formData);

    setSubmitted(true);
    setErrors({});
  }

  return (
    <main className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-sb-blue/30 bg-sb-nav p-8 shadow-lg">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-sb-white">Support</h1>
          <p className="mt-2 text-sb-text">
            Submit a support ticket if you run into an issue or need help using the app.
          </p>
        </header>

        {submitted && (
          <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-green-300">
            Your support ticket was submitted successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="mb-2 block font-medium text-sb-white">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-sb-blue/30 bg-sb-bg px-4 py-3 text-sb-white outline-none transition focus:border-sb-blue"
              placeholder="Enter your name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block font-medium text-sb-white">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-sb-blue/30 bg-sb-bg px-4 py-3 text-sb-white outline-none transition focus:border-sb-blue"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="issueType" className="mb-2 block font-medium text-sb-white">
              Issue Type
            </label>
            <select
              id="issueType"
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              className="w-full appearance-none rounded-lg border border-sb-blue/30 bg-sb-bg px-4 py-3 text-sb-white outline-none transition focus:border-sb-blue"
            >
              <option value="Bug Report" className="bg-sb-bg text-sb-white">
                Bug Report
              </option>
              <option value="Account Issue" className="bg-sb-bg text-sb-white">
                Account Issue
              </option>
              <option value="Prediction Error" className="bg-sb-bg text-sb-white">
                Prediction Error
              </option>
              <option value="General Question" className="bg-sb-bg text-sb-white">
                General Question
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block font-medium text-sb-white">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-sb-blue/30 bg-sb-bg px-4 py-3 text-sb-white outline-none transition focus:border-sb-blue"
              placeholder="Describe the issue..."
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          <button
            type="submit"
            className="rounded-lg bg-sb-blue px-5 py-3 font-semibold text-sb-white transition hover:bg-sb-blue-light"
          >
            Submit Ticket
          </button>
        </form>
      </div>
    </main>
  );
}
