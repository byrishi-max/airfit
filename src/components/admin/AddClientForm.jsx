import React, { useState } from 'react';
import Button from '../common/Button';

const AddClientForm = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && phone) {
      onAdd({ name, phone });
      setName('');
      setPhone('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">Add New Client</h3>
      
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Doe"
          className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 9876543210"
          className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
          required
        />
      </div>

      <Button type="submit" className="w-full mt-2">
        Generate Access Code
      </Button>
    </form>
  );
};

export default AddClientForm;
