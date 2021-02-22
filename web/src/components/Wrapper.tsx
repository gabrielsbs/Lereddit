import { Box } from '@chakra-ui/react'
import React from 'react'

export type WrapperVariant = 'small' | 'regular'

interface WrapperProps {
  variant?: WrapperVariant
}

export const Wrapper: React.FC<WrapperProps> = ({ children, variant }) => {
  return (
    <Box mt={8} mx='auto' maxW={variant === 'small' ? '400px' : '800px'} w='100%'>
      {children}
    </Box>
  )
}
