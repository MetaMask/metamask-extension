import { createTheme, type ThemeOptions } from '@mui/material/styles';

/**
 * The MUI theme overrides for the date/time pickers to match MetaMask design system.
 */
export const muiPickerTheme = createTheme({
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiDialog-paper': {
            backgroundColor: 'var(--color-background-default) !important',
            color: 'var(--color-text-default)',
            fontFamily: 'var(--font-family-default)',
            borderRadius: '8px',
            '& *': {
              fontFamily: 'inherit',
            },
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '0 !important',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
          justifyContent: 'flex-start',
          '& > button:nth-of-type(2)': {
            marginLeft: 'auto',
          },
          '& > button': {
            color: 'var(--color-primary-default)',
            fontWeight: 'var(--typography-s-body-md-medium-font-weight)',
            fontSize: 'var(--typography-s-body-md-medium-font-size)',
            lineHeight: 'var(--typography-s-body-md-medium-line-height)',
            letterSpacing: 'var(--typography-s-body-md-medium-letter-spacing)',
            textTransform: 'none',
            '&:hover': {
              textDecoration: 'underline',
              textDecorationThickness: '2px',
              textUnderlineOffset: '4px',
              backgroundColor: 'transparent',
            },
          },
        },
      },
    },
    MuiDateTimePickerTabs: {
      styleOverrides: {
        root: {
          display: 'none',
        },
      },
    },
    MuiPickersToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--color-background-alternative)',
          padding: '16px 24px',
        },
        content: {
          justifyContent: 'space-around',
        },
        penIconButton: {
          display: 'none',
        },
      },
    },
    MuiPickersToolbarText: {
      styleOverrides: {
        root: {
          color: 'var(--color-text-alternative)',
          '&.Mui-selected': {
            color: 'var(--color-text-default)',
          },
        },
      },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: {
        root: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px 8px 0',
          margin: 0,
          maxHeight: 'none',
          minHeight: 40,
          position: 'relative',
          '& .MuiPickersArrowSwitcher-root': {
            position: 'absolute',
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          },
          '& .MuiPickersArrowSwitcher-button': {
            pointerEvents: 'auto',
          },
        },
        labelContainer: {
          marginRight: 0,
          color: 'var(--color-text-default)',
          cursor: 'default',
          pointerEvents: 'none',
          fontSize: 16,
          fontWeight: 400,
        },
        switchViewButton: {
          display: 'none',
        },
      },
    },
    MuiPickersArrowSwitcher: {
      styleOverrides: {
        button: {
          color: 'var(--color-icon-alternative)',
          backgroundColor: 'var(--color-background-alternative)',
          '&:hover': {
            backgroundColor: 'var(--color-background-alternative-hover)',
          },
        },
      },
    },
    MuiDayCalendar: {
      styleOverrides: {
        weekDayLabel: {
          color: 'var(--color-text-alternative)',
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          color: 'var(--color-text-default)',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'var(--color-background-alternative-hover)',
          },
          '&.Mui-selected': {
            backgroundColor: 'var(--color-primary-default)',
            color: 'var(--color-primary-inverse)',
            '&:hover': {
              backgroundColor: 'var(--color-primary-default-hover)',
            },
            '&:focus': {
              backgroundColor: 'var(--color-primary-default)',
            },
          },
          '&.MuiPickersDay-today': {
            borderColor: 'var(--color-primary-default)',
          },
          '&.Mui-disabled': {
            color: 'var(--color-text-muted)',
          },
        },
      },
    },
    MuiClock: {
      styleOverrides: {
        root: {
          margin: '24px auto 16px',
        },
        clock: {
          backgroundColor: 'var(--color-background-alternative)',
        },
        pin: {
          backgroundColor: 'var(--color-primary-default)',
        },
      },
    },
    MuiClockPointer: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--color-primary-default)',
        },
        thumb: {
          borderColor: 'var(--color-primary-default)',
          backgroundColor: 'var(--color-primary-inverse)',
        },
      },
    },
    MuiClockNumber: {
      styleOverrides: {
        root: {
          color: 'var(--color-text-default)',
          '&.Mui-selected': {
            color: 'var(--color-primary-inverse)',
          },
        },
      },
    },
  },
} as ThemeOptions);
