// src/components/MaskedInput.jsx (НОВЫЙ ФАЙЛ)
import React from 'react';
import { IMaskInput } from 'react-imask';
import { Input } from 'antd';

// Мы создаем компонент-обертку, который принимает все пропсы от Form.Item
// и правильно передает их дальше.
const MaskedInput = React.forwardRef((props, ref) => {
  const { onChange, ...rest } = props;

  // Form.Item ждет, что ему вернется просто значение.
  // IMaskInput вызывает onAccept, когда значение в маске меняется.
  const handleAccept = (value) => {
    if (onChange) {
      // Вызываем функцию onChange, которую нам дал Form.Item
      onChange({ target: { value } });
    }
  };

  return (
    <Input
      {...rest} // Передаем все остальные пропсы (placeholder, id и т.д.)
      mask="+7 (000) 000-00-00"
      as={Input} // Говорим ему выглядеть как Input от AntD
      inputRef={ref} // Передаем ref для управления фокусом
      onAccept={handleAccept} // Используем правильный обработчик
    />
  );
});

export default MaskedInput;