import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={props.className ? `text-input ${props.className}` : 'text-input'} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={props.className ? `text-input ${props.className}` : 'text-input'} />
}


