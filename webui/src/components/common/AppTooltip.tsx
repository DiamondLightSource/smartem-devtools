import { styled } from '@mui/material/styles'
import Tooltip, { tooltipClasses, type TooltipProps } from '@mui/material/Tooltip'

export const AppTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: 400,
    padding: '8px 12px',
    borderRadius: 4,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: '#1a1a1a',
  },
})
