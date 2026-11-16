import React, { useEffect, useState } from 'react';
import { formatDecimal, parseDecimal } from '../lib/numbers';

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number | string | null | undefined;
  onValueChange: (value: number) => void;
  fractionDigits?: number;
  clearZeroOnFocus?: boolean;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onValueChange,
  fractionDigits = 2,
  clearZeroOnFocus = true,
  onFocus,
  onBlur,
  ...props
}) => {
  const [text, setText] = useState(() => formatDecimal(value, fractionDigits));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatDecimal(value, fractionDigits));
  }, [value, fractionDigits, focused]);

  return <input
    {...props}
    type="text"
    inputMode="decimal"
    value={text}
    onFocus={event => {
      setFocused(true);
      if (clearZeroOnFocus && parseDecimal(text) === 0) setText('');
      onFocus?.(event);
    }}
    onChange={event => {
      const next = event.target.value;
      if (!/^\d*(?:[,.]\d*)?$/.test(next)) return;
      setText(next);
      const parsed = parseDecimal(next);
      if (parsed !== null) onValueChange(parsed);
    }}
    onBlur={event => {
      setFocused(false);
      const parsed = parseDecimal(text);
      const next = parsed ?? 0;
      onValueChange(next);
      setText(formatDecimal(next, fractionDigits));
      onBlur?.(event);
    }}
  />;
};
