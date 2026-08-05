import React, { useState } from 'react';

interface Props {
  isSuspended: boolean;
  onChange: (newSuspendedState: boolean) => Promise<void> | void;
  disabled?: boolean;
}

export const UserSuspensionToggle: React.FC<Props> = ({ isSuspended, onChange, disabled }) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled || loading) return;
    const newState = !isSuspended;
    try {
      setLoading(true);
      await onChange(newState);
    } catch (err) {
      console.error('Erro ao alterar status de suspensão:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || loading}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer ${
        isSuspended ? 'bg-red-600' : 'bg-gray-300'
      } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          isSuspended ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};
