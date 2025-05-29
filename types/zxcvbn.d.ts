declare module 'zxcvbn' {
  export default function zxcvbn(password: string): {
    score: number;
    guesses: number;
  };
}
