import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import mammoth from 'mammoth'


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export const extractTextFromFile = async (
  file: ArrayBuffer,
): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: file })
    return result.value
  } catch (error) {
    console.error('Error extracting text:', error)
    return ''
  }
}