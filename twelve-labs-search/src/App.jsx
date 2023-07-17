import { useState } from 'react'
import './App.css'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import UploadYoutubeVideo from './UploadYoutubeVideo'
import Grid from '@mui/material/Unstable_Grid2/'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#b4f464',
    },
    secondary: { 
      main: '#fc8c3c' 
    }
  }
});

function App() {
  const [indexID, setIndexID] = useState()
  const [indexedVideos, setIndexedVideos] = useState()

  return (
    <>
      <ThemeProvider theme={theme}>
        <Grid display='flex' justifyContent='center' alignItems='center' minHeight='95vh' container>
          <UploadYoutubeVideo indexedVideos={ indexedVideos } setIndexedVideos={ setIndexedVideos }/>
        </Grid>
        <CssBaseline />
      </ThemeProvider>
    </>
  )
}

export default App
