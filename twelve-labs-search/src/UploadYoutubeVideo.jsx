import { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Unstable_Grid2/'
import DescriptionIcon from '@mui/icons-material/Description'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import VideoSettingsIcon from '@mui/icons-material/VideoSettings'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import TextField from '@mui/material/TextField'
import sanitize from 'sanitize-filename'
import LinearProgress from '@mui/material/LinearProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Box } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import MessageIcon from '@mui/icons-material/Message'
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined'
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import FontDownloadOutlinedIcon from '@mui/icons-material/FontDownloadOutlined';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import ReactPlayer from 'react-player'

const SERVER_BASE_URL = process.env.CODESPACE_NAME !== 'undefined' ? new URL (`https://${process.env['CODESPACE_NAME']}-4000.preview.app.github.dev`) :
    new URL('http://localhost:4000')
const INDEX_ID_INFO_URL = new URL('/get-index-info', SERVER_BASE_URL)
const JSON_VIDEO_INFO_URL = new URL('/json-video-info', SERVER_BASE_URL)
const CHANNEL_VIDEO_INFO_URL = new URL('/channel-video-info', SERVER_BASE_URL)
const DOWNLOAD_URL = new URL('/download', SERVER_BASE_URL)
const CHECK_TASKS_URL = new URL('/check-tasks', SERVER_BASE_URL)
const UPDATE_VIDEO_URL = new URL('/update-video', SERVER_BASE_URL)

function UploadYoutubeVideo ({indexedVideos, setIndexedVideos}) {
    const [taskVideos, setTaskVideos] = useState(null)
    const [pendingApiRequest, setPendingApiRequest] = useState(false)
    const [apiElement, setApiElement] = useState(null)
    const [selectedJSON, setSelectedJSON] = useState(null)
    const [youtubeChannelId, setYoutubeChannelId] = useState(null)
    const [indexId, setIndexId] = useState(null)
    const [indexName, setIndexName] = useState(null)
    const [searchQuery, setSearchQuery] = useState(null)
    const [searchOptions, setSearchOptions] = useState(['visual', 'conversation', 'text-in-video', 'logo'])

    const handleJSONSelect = (event) => {
        setSelectedJSON(event.target.files[0])
    }

    const handleReset = () => {
        setIndexId(null)
        setIndexedVideos(null)
        setTaskVideos(null)
        setSelectedJSON(null)
        setYoutubeChannelId(null)
        setPendingApiRequest(false)
        setIndexName(null)
        setSearchQuery(null)
        setSearchOptions(['visual', 'conversation', 'text-in-video', 'logo'])
    }

    const updateApiElement = (text) => {
        if (text) {
            let apiRequestElement = 
                <Box>
                    <LinearProgress/>
                    <Typography variant="body2" color="text.secondary" display='flex' alignItems='center'>
                        { text }
                    </Typography>
                </Box>
                setApiElement(apiRequestElement)
        } else {
            setApiElement(null)
        }
        setPendingApiRequest(previousPendingApiRequest => !previousPendingApiRequest)
    }

    const handleYoutubeUrlEntry = (event) => {
        setYoutubeChannelId(event.target.value)
    }

    const handleIndexIdEntry = (event) => {
        setIndexId(event.target.value)
    }

    const getInfo = async () => {
        updateApiElement('Getting Data...')
        if (selectedJSON) {
            let fileReader = new FileReader()
            fileReader.readAsText(selectedJSON)
            fileReader.onloadend = async () => {
                const jsonVideos = JSON.parse(fileReader.result)
                
                const response = await Promise.all(jsonVideos.map(getJsonVideoInfo))
                setTaskVideos(response)
            }
        } else if (youtubeChannelId) {
            const response = await getChannelVideoInfo(youtubeChannelId)
            setTaskVideos(response)
        } else if (indexId) {
            const response = await getIndexInfo()
            setIndexedVideos(response)
        }
        updateApiElement()
    }

    const getJsonVideoInfo = async (videoData) => {
        const queryUrl = JSON_VIDEO_INFO_URL
        queryUrl.searchParams.set('URL', videoData.url)
        const response = await fetch(queryUrl.href)
        return await response.json()
    }

    const getChannelVideoInfo = async () => {
        const queryUrl = CHANNEL_VIDEO_INFO_URL
        queryUrl.searchParams.set('CHANNEL_ID', youtubeChannelId)
        const response = await fetch(queryUrl.href)
        return await response.json()
    }

    const getIndexInfo = async () => {
        const queryUrl = INDEX_ID_INFO_URL
        queryUrl.searchParams.set('INDEX_ID', indexId)
        const response = await fetch(queryUrl.href)
        return await response.json()
    }

    const indexYouTubeVideos = async () => {
        updateApiElement()
        const videoData = taskVideos.map(videoData => { return {url: videoData.video_url, title: videoData.title }})
        const requestData = {
            videoData: videoData,
            indexName: indexName
        }
        const data = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        }
        const response = await fetch(DOWNLOAD_URL.toString(), data)
        const json = await response.json()
        const taskIds = json.taskIds
        setIndexId(json.indexId)
        await monitorTaskIds(taskIds)
    }

    const monitorTaskIds = async (taskIds) => {
        const sleep = ms => new Promise(
            resolve => setTimeout(resolve, ms)
        );
        let poll = true

        while (poll) {
            const taskStatuses = taskIds.map( async taskId => {
                const queryUrl = CHECK_TASKS_URL
                queryUrl.searchParams.set('TASK_ID', taskId._id)
                const response = await fetch(queryUrl.href)
                return await response.json()
            })
            const statuses = await Promise.all(taskStatuses)
            const videoTasksStatuses = statuses.map( status => {
                const taskMatch = taskVideos.filter( video => {
                    const safeName = `${sanitize(video.title)}.mp4`
                    if (safeName === status.metadata.filename) {
                        return video
                    }
                })
                if (taskMatch) {
                    return {...taskMatch[0], ...status}
                }
            })
            setTaskVideos(videoTasksStatuses)
            if (statuses.every(status => status.status === 'ready')) {
                poll = false
                updateApiElement()
                const response = await getIndexInfo()
                setIndexedVideos(response)
            } else {
                await sleep(10000)
            }
        }
    }

    const handleSearchOptions = async (option) => {
        let tempSearchOptions = searchOptions
        if (searchOptions.includes(option)) {
            tempSearchOptions.splice(searchOptions.indexOf(option), 1)
        } else {
            tempSearchOptions.push(option)
        }
        console.log(tempSearchOptions)
        setSearchOptions(tempSearchOptions)
    }

    let controls = <></>
    let videos = <></>
    let waitingBar = 
        <Box sx={{ width: '100%', py: '1vh' }}> 
            <LinearProgress/> 
        </Box>

    if (indexedVideos && !pendingApiRequest) {
        videos = indexedVideos.map(video => { 
            let element = 
                <Grid key={ video._id } xs={12} sm={6} md={4} lg={3}>
                    <Grid xs>
                        <Card>
                            <CardMedia sx={{ objectFit: "contain" }}>
                                <ReactPlayer url={ video.hls.video_url } controls width='100%' height='100%' 
                                    light={ <img src={ video.hls.thumbnail_urls[0] } height='100%' width='100%'/> } playing/>
                            </CardMedia>
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="div">
                                    { video.metadata.filename.replace('.mp4', '').split(' ').slice(0, 5).join(' ') }...
                                </Typography>
                                <Typography variant="body2" color="text.secondary" display='flex' alignItems='center'>
                                    Length:  { Math.round(video.metadata.duration) }s <AccessTimeIcon color='primary' sx={{ ml: 1 }}></AccessTimeIcon>
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            return element
        })

        console.log(searchOptions)

        controls = 
            <>
                <Grid justifyContent='center' alignItems='center' direction='column' container disableEqualOverflow>
                    <Grid direction='row' container sx={{pb: '2vh', width: '100%', bgcolor: '#121212', 'z-index': 5}} position='fixed' top='0' justifyContent='center' alignItems='end'>
                        <Grid>
                            <TextField label='Search' variant='standard' fullWidth 
                                disabled={ pendingApiRequest ? true : false } onChange={ (event) => setSearchQuery(event.target.value) }/>
                        </Grid>
                        
                        <Grid>
                            <Button component='label' disabled={ (pendingApiRequest || !searchQuery || !searchOptions) ? true : false }>
                                <VideoSettingsIcon color='primary' sx={{ mr: 1 }}></VideoSettingsIcon>
                                Submit Search
                            </Button>
                        </Grid>

                        <Checkbox icon={ <VisibilityOutlinedIcon/> } checkedIcon={ <VisibilityIcon/> } defaultChecked 
                            onChange={ () => { handleSearchOptions('visual') }}/>
                        <Checkbox icon={ <MessageOutlinedIcon/> } checkedIcon={ <MessageIcon/> } defaultChecked
                            onChange={ () => { handleSearchOptions('conversation') }}/>
                        <Checkbox icon={ <FontDownloadOutlinedIcon/> } checkedIcon={ <FontDownloadIcon/> } defaultChecked
                            onChange={ () => { handleSearchOptions('text-in-video') }} />
                        <Checkbox icon={ <CenterFocusStrongOutlinedIcon/> } checkedIcon={ <CenterFocusStrongIcon/> } defaultChecked
                            onChange={ () => { handleSearchOptions('logo') }}/>

                        <Grid>
                            <Button component='label' onClick={ handleReset } disabled={ pendingApiRequest ? true : false }>
                                <RestartAltIcon color='primary' sx={{ mr: 1 }}/>
                                Reset
                            </Button>
                        </Grid>
                    </Grid>

                        { apiElement }


                    <Grid direction='row' spacing={ 2 } justifyContent='center' alignItems='center' container sx={{m: '8vh'}}>
                        { videos }
                    </Grid>
                </Grid>
            </>
    } else if (taskVideos) {
        let indexingStatus

        videos = taskVideos.map(video => { 
            if (video.status) {
                let indexingMessage = video.status === 'ready' ? <> Done Indexing <CheckCircleIcon/> </> : 'Waiting...'

                indexingStatus = 
                    <>
                        { video.status === 'ready' ? null : waitingBar }
                        <Typography variant="body2" color="text.secondary" display='flex' alignItems='center'>
                            { video.process ? `Indexing. ${Math.round(video.process.upload_percentage)}% complete` : indexingMessage }
                        </Typography>
                    </>
            }

            let element = 
                <Grid key={ video.videoId } xs={12} sm={6} md={4} lg={3}>
                    <Grid xs>
                        <Card>
                            <a href={ video.video_url } target='_blank'>
                                <CardMedia
                                    sx={{ height: '20vh' }}
                                    image={ video.thumbnails[video.thumbnails.length-1].url }
                                />
                            </a>
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="div">
                                    { video.title.split(' ').slice(0, 5).join(' ') }...
                                </Typography>
                                <Typography variant="body2" color="text.secondary" display='flex' alignItems='center'>
                                    Length:  { video.lengthSeconds }s <AccessTimeIcon color='primary' sx={{ ml: 1 }}></AccessTimeIcon>
                                </Typography>
                                <Typography variant="body2" color="text.secondary" display='flex' alignItems='center'>
                                    Views:  { video.viewCount } <VisibilityIcon color='primary' sx={{ ml: 1 }}></VisibilityIcon>
                                </Typography>
                                { indexingStatus }
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            return element
        })

        controls = 
            <>
                <Grid justifyContent='center' alignItems='center' direction='column' container disableEqualOverflow>
                    <Grid direction='row' container sx={{pb: '2vh', width: '100%', bgcolor: '#121212', 'z-index': 5}} position='fixed' top='0' justifyContent='center' alignItems='end'>
                        <Grid>
                            <TextField label='Index Name' variant='standard' fullWidth onChange={ (event) => setIndexName(event.target.value)} disabled={ pendingApiRequest ? true : false }/>
                        </Grid>
                        
                        <Grid>
                            <Button component='label' onClick={ indexYouTubeVideos } disabled={ pendingApiRequest ? true : false }>
                                <VideoSettingsIcon color='primary' sx={{ mr: 1 }}></VideoSettingsIcon>
                                Index Videos
                            </Button>
                        </Grid>

                        <Grid>
                            <Button component='label' onClick={ handleReset } disabled={ pendingApiRequest ? true : false }>
                                <RestartAltIcon color='primary' sx={{ mr: 1 }}/>
                                Reset
                            </Button>
                        </Grid>
                    </Grid>

                        { apiElement }


                    <Grid direction='row' spacing={ 2 } justifyContent='center' alignItems='center' container sx={{m: '8vh'}}>
                        { videos }
                    </Grid>
                </Grid>
            </>
    } else {
        controls =
            <>
                <Grid display='flex' justifyContent='center' alignItems='center' container direction='column' xs>
                    <Grid display='flex' xs>
                        <Button component='label' onChange={ handleJSONSelect } disabled={ !!youtubeChannelId || pendingApiRequest || !!indexId }>
                            Select JSON URL File
                            <input
                                type='file'
                                accept='.json'
                                hidden
                            />
                        </Button>
                    </Grid>

                    <Grid sx={{mb: 3}} display='flex' xs={3}>
                        <TextField label='Index ID' variant='standard' fullWidth onChange={ handleIndexIdEntry } disabled={ !!selectedJSON || !!youtubeChannelId }/>
                    </Grid>

                    <Grid sx={{mb: 3}} display='flex' xs={3}>
                        <TextField label='Channel ID' variant='standard' fullWidth onChange={ handleYoutubeUrlEntry } disabled={ !!selectedJSON || !!indexId }/>
                    </Grid>
                
                    <Grid display='flex' justifyContent='center' alignItems='center' xs>
                        <DescriptionIcon color='primary'/>
                        <strong>Selected File:</strong>
                    </Grid>

                    <Grid display='flex' justifyContent='center' alignItems='center' xs>
                        { selectedJSON ? selectedJSON.name : 'None' }
                    </Grid>

                    <Grid display='flex' xs>
                        <Button disabled={ (!selectedJSON && !youtubeChannelId && !indexId) || (pendingApiRequest) ? true : false} onClick={ getInfo }>
                            Submit
                        </Button>
                    </Grid>

                    { apiElement }
                </Grid>
            </>
    }

    return (
        controls
    )
}

export default UploadYoutubeVideo
