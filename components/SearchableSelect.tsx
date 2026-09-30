import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Selecione...', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => options.find(opt => opt.id === value), [options, value]);

  const filteredOptions = useMemo(() =>
    options.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);
  
  useEffect(() => {
    if (isOpen) {
        // Focus the input when the dropdown opens
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full p-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className={`block truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Pesquisar..."
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="overflow-auto max-h-48" tabIndex={-1} role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-100 hover:text-green-900 ${value === option.id ? 'text-green-900 font-semibold' : 'text-gray-900'}`}
                  role="option"
                  aria-selected={value === option.id}
                >
                  <span className="block truncate">{option.name}</span>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500 cursor-default">Nenhum motorista encontrado.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;