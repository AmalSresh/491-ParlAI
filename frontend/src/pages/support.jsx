import { useState } from 'react';

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issueType: 'Bug Report',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

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

    console.log('Submitted ticket:', formData);

    setSubmitted(true);
    setFormData({
      name: '',
      email: '',
      issueType: 'Bug Report',
      description: '',
    });
    setErrors({});
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="mt-2 text-slate-300">
          Submit a ticket if you ran into an issue or need help using the app.
        </p>
      </header>

      {submitted && (
        <div className="mb-6 rounded-lg border border-green-500 bg-green-900/30 px-4 py-3 text-green-200">
          Your support ticket was submitted successfully.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/60 p-6"
      >
        <div>
          <label htmlFor="name" className="mb-2 block font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-2 text-white"
            placeholder="Enter your name"
          />
          {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-2 text-white"
            placeholder="Enter your email"
          />
          {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="issueType" className="mb-2 block font-medium">
            Issue Type
          </label>
          <select
            id="issueType"
            name="issueType"
            value={formData.issueType}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-2 text-white"
          >
            <option>Bug Report</option>
            <option>Account Issue</option>
            <option>Prediction Error</option>
            <option>General Question</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-2 text-white"
            placeholder="Describe the issue..."
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-400">{errors.description}</p>
          )}
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500"
        >
          Submit Ticket
        </button>
      </form>
    </main>
  );
}
