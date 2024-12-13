// import logo from './logo.svg';
// import './App.css';
import axios from "axios";
import { useState, useEffect } from "react";
import {
    Button,
    Layout,
    Col,
    Row,
    Typography,
    ConfigProvider,
    theme,
    Switch,
    Card,
    Image,
    Form,
    Input,
    Descriptions,
    Divider
} from "antd";
import {
    MoonOutlined,
    SunOutlined,
    MoonFilled,
    SunFilled,
    ExportOutlined
} from '@ant-design/icons';
import Container from '@mui/material/Container';
const { Header, Content, Footer } = Layout;
const App = () => {
    const [form] = Form.useForm();
    let [playList, setPlayList] = useState([])
    let [playListInfo, setPlayListInfo] = useState(null)
    let [unAvail, setUnAvail] = useState([])
    let [loading, setLoading] = useState(false)
    let [modeTheme, setModeTheme] = useState("light")
    let y = new Date().getFullYear()
    console.log("y", y)
    async function fetchPlaylist(values) {
        setLoading(true)
        let flag = true
        let pageToken = null
        let myList = []
        let unAvailList = []

        let playlistResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlists?part=contentDetails,id,snippet,localizations,status&id=${values.playlistid}&key=${values.apikey}`)
        // let plImageResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlistImages?part=snippet&playlistId=${values.playlistid}&key=${values.apikey}`)
        console.log("playlistResponse", playlistResponse)
        // console.log("plImageResponse", plImageResponse)
        while (flag) {
            try {
                let URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,id,snippet,status&playlistId=${values.playlistid}&maxResults=1000&key=${values.apikey}`;
                if (pageToken !== null) {
                    URL = URL + `&pageToken=${pageToken}`
                }
                const response = await axios.get(URL);
                // setPlayList(response.data.items);
                myList = myList.concat(response.data.items)
                // pageToken = response.data?.nextPageToken ?? "abc"
                for (let ite of response.data.items) {
                    if (ite?.status?.privacyStatus !== "public") {
                        unAvailList.push(ite)
                    }
                }
                if (response.data.nextPageToken) {
                    pageToken = response.data?.nextPageToken
                }
                else {
                    throw ("123")
                }
            }
            catch (e) {
                console.log("ERROR!", e)
                flag = false
                console.log(myList)
                setUnAvail(unAvailList)
                setPlayList(myList)
            }
        }
        setPlayListInfo(playlistResponse.data.items[0])
        setLoading(false)
        // console.log(response.data)
    }
    useEffect(() => {
        let modeThemeStorage = localStorage.getItem("modeTheme")
        if (modeThemeStorage == "dark") {
            localStorage.setItem("modeTheme", "dark")
            setModeTheme("dark")
        }
        else {
            localStorage.setItem("modeTheme", "light")
            setModeTheme("light")
        }
    }, [])
    const items = [
        {
            key: '1',
            label: 'Playlist',
            children: playListInfo ? playListInfo?.snippet?.title : null
        },
        {
            key: '2',
            label: 'Author',
            children: playListInfo ? playListInfo?.snippet?.channelTitle : null
        },
        {
            key: '3',
            label: 'Manual count',
            children: playListInfo ? playList.length : null
        },
        {
            key: '4',
            label: 'Video count',
            children: playListInfo ? `${playListInfo?.contentDetails?.itemCount}` : null
        },
        {
            key: '5',
            label: 'Unavailable',
            children: playListInfo ? unAvail.length : null
        },
        {
            key: '6',
            label: 'URL',
            children: playListInfo ? <Typography.Link
                href={`https://www.youtube.com/playlist?list=${playListInfo.id}`} target="_blank"
            >{`https://www.youtube.com/playlist?list=${playListInfo.id}`}</Typography.Link> : null
        },

    ];
    return (
        <ConfigProvider theme={{
            algorithm: modeTheme == "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm
        }}>
            <Layout
                style={{
                    height: "100%",
                    overflowY: "scroll", paddingTop: 16, paddingBottom: 16,
                    scrollbarColor: "red"
                }}
            >
                {/* <Content> */}
                <Container style={{ height: "100%" }}>
                    <>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                            <Form form={form} name="horizontal_login" layout="inline" onFinish={fetchPlaylist}>
                                <Form.Item
                                    name="playlistid"
                                    label="Playlist ID"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please input your Playlist ID!',
                                        },
                                    ]}
                                >
                                    <Input
                                        // prefix={<UserOutlined />} 
                                        placeholder="Playlist ID" />
                                </Form.Item>
                                <Form.Item
                                    name="apikey"
                                    label="API key"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please input your API key!',
                                        },
                                    ]}
                                >
                                    <Input
                                        // prefix={<LockOutlined />} 
                                        placeholder="API key" />
                                </Form.Item>
                                <Form.Item shouldUpdate>
                                    {() => (
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading}
                                        >
                                            Fetch
                                        </Button>
                                    )}
                                </Form.Item>
                            </Form>
                            <Switch checked={modeTheme == "light"}
                                unCheckedChildren={<MoonFilled />}
                                checkedChildren={<SunFilled />}
                                onClick={(checked, event) => {
                                    if (checked) {
                                        localStorage.setItem("modeTheme", "light")
                                        setModeTheme("light")
                                    }
                                    else {
                                        localStorage.setItem("modeTheme", "dark")
                                        setModeTheme("dark")
                                    }
                                }} />
                        </div>
                        {loading == true
                            ?
                            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {modeTheme == "dark"
                                    ? <Image preview={false} width={"50%"} src="./tetris_only_black.gif" />
                                    : <Image preview={false} width={"50%"} src="./zero_two.gif" />}


                            </div>
                            : null
                        }

                        {
                            unAvail?.length > 0 && loading == false ?
                                <>
                                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                                        <Col span={24}>
                                            <Descriptions title="Playlist Info" items={items} size="small" column={3}
                                                layout="vertical"
                                                // contentStyle={{
                                                //     justifyContent: "flex-start"
                                                // }}
                                                style={{ width: "80%" }}
                                            />
                                        </Col>
                                        {unAvail.map((ite, index) =>
                                            <Col span={24} key={index}>
                                                <Card bordered styles={{
                                                    body: {
                                                        padding: 8
                                                    }
                                                }}>
                                                    <Row gutter={[8, 8]}>
                                                        <Col span={2} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                            <Typography.Title style={{ margin: 0 }} level={4}>{ite.snippet.position}</Typography.Title>
                                                        </Col>
                                                        <Col span={3}>
                                                            <Image src={ite.snippet.thumbnails?.default?.url} />
                                                        </Col>
                                                        <Col span={19}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%" }}>
                                                                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                                                    <Typography.Title copyable style={{ margin: 0 }} level={4}>{ite.snippet.title}</Typography.Title>
                                                                    <Typography.Paragraph style={{ margin: 0 }}>{ite.snippet.videoOwnerChannelTitle}</Typography.Paragraph>
                                                                    <Typography.Paragraph type={ite.status.privacyStatus == "unlisted" ? "success" : "danger"} style={{ margin: 0 }}>{ite.status.privacyStatus}</Typography.Paragraph>
                                                                </div>
                                                                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" }}>
                                                                    <Typography.Text copyable>{ite.contentDetails.videoId}</Typography.Text>
                                                                    <Typography.Link copyable={{
                                                                        icon: <ExportOutlined />
                                                                    }} target="_blank" href={`https://www.youtube.com/watch?v=${ite.contentDetails.videoId}`}>{`https://www.youtube.com/watch?v=${ite.contentDetails.videoId}`}</Typography.Link>
                                                                    <Typography.Link copyable={{
                                                                        icon: <ExportOutlined />
                                                                    }} target="_blank" href={`https://web.archive.org/web/${new Date().getFullYear()}*/https://youtube.com/watch?v=${ite.contentDetails.videoId}`}>{`https://web.archive.org/web/${new Date().getFullYear()}*/https://youtube.com/watch?v=${ite.contentDetails.videoId}`}</Typography.Link>
                                                                </div>
                                                            </div>
                                                            {/* <div>
                                                                    <a target="_blank" href={`https://www.youtube.com/watch?v=${ite.contentDetails.videoId}`}>{`https://youtube.com/${ite.contentDetails.videoId}`}</a>
                                                                    <br />
                                                                    <a target="_blank" href={`https://music.youtube.com/watch?v=${ite.contentDetails.videoId}`}>{`https://music.youtube.com/${ite.contentDetails.videoId}`}</a>
                                                                </div> */}
                                                        </Col>
                                                    </Row>
                                                </Card>
                                            </Col>)}
                                    </Row>
                                </>
                                : null
                        }
                    </>
                </Container >
                {/* </Content> */}
            </Layout>
        </ConfigProvider >
    );
}

export default App;
