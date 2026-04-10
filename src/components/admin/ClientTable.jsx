import React from 'react';
import Button from '../common/Button';

const ClientTable = ({ clients, onUpdatePlan }) => {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-black/50 border-b border-gray-800">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Client</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Phone</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Plan</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {clients.map((client) => (
              <tr key={client.clientId} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-white font-bold">{client.name}</div>
                  <div className="text-xs text-gray-500">ID: {client.clientId.slice(0, 8)}</div>
                </td>
                <td className="px-6 py-4 text-gray-400 font-medium">{client.phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    client.planStatus === 'active' 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  }`}>
                    {client.planStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {client.workoutPlan ? `Plan Active (W1-${client.workoutPlan.exercises.length})` : 'No Plan Set'}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button 
                    variant="outline" 
                    className="px-3 py-1.5 text-[10px]" 
                    onClick={() => onUpdatePlan(client)}
                  >
                    Edit Plan
                  </Button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-600 font-medium">
                  No clients registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;
