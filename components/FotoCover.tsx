'use client'

import { CSSProperties } from 'react'

type FotoCoverProps = {
  src: string
  alt?: string
  className?: string
  style?: CSSProperties
}

// Mostra a imagem inteira, sem cortar, preenchendo o espaço ao redor com uma
// versão desfocada dela mesma. Evita que fotos/artes verticais fiquem
// cortadas ou "com zoom" dentro de quadros quadrados/horizontais.
export default function FotoCover({ src, alt = '', className, style }: FotoCoverProps) {
  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', filter: 'blur(22px) brightness(0.55)', transform: 'scale(1.2)',
        }}
      />
      <img
        src={src}
        alt={alt}
        style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}
