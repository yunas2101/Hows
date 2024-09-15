import styles from './Main.module.css'
import { Post } from './Post/Post'
import {
    Routes,
    Route,
    Navigate,
    useNavigate,
    useLocation,
    useParams,
} from 'react-router-dom'
import banner from '../../../../assets/images/마이페이지_가로배너.jpg'
import profile from '../../../../assets/images/마이페이지_프로필사진.jpg'

import { useEffect, useState, useRef } from "react";
import { api } from "./../../../../config/config";
import { Scrap } from "./Scrap/Scrap";
import { Guestbook } from "./Guestbook/Guestbook";
import { Modal } from "../../../../components/Modal/Modal"
import { useAuthStore, useMemberStore } from "../../../../store/store";
import { countBookmark, countGuestbook, countPost, deleteProfileImage, findMemberSeq, getCountFollow, getFollower, getFollowing, selectInfo, toggleFollow, uploadProfileImage, userInfo } from "../../../../api/member";
import { TextBox } from './TextBox/TextBox';
import Swal from "sweetalert2";
import { jwtDecode } from 'jwt-decode';

export const Main = () => {
    const navi = useNavigate()
    const location = useLocation()
    const fileInputRef = useRef(null); // ref 생성

    const [user, setUser] = useState([])
    const { member_id } = useParams() // URL에서 member_id 가져오기
    const { memberSeq, setMemberSeq } = useMemberStore()
    const [isModalOpen, setIsModalOpen] = useState(false) // 모달 상태
    const [selectedImage, setSelectedImage] = useState(profile) // 선택한 이미지 초기값
    // const [selectedFile, setSelectedFile] = useState(null); // 선택한 파일
    const [modalContent, setModalContent] = useState('') // 모달 창에 표시할 내용을 구분하는 상태

    const [postData, setPostData] = useState(0); // 게시물 개수
    const [scrapData, setScrapData] = useState(0); // 스크랩 개수
    const [guestbookData, setGuestbookData] = useState(0); // 방명록 개수

    const [countFollow, setCountFollow] = useState({}); // 팔로워, 팔로잉 수
    const [followerData, setFollowerData] = useState([]); // 팔로워 데이터
    const [followingData, setFollowingData] = useState([]); // 팔로잉 데이터

    const { currentUser, setCurrentUser } = useMemberStore();
    const { isAuth } = useAuthStore() // 로그인 여부 확인
    const session_member_id = sessionStorage.getItem('member_id') // 세션에서 member_id 가져오기
    const session_member_seq = jwtDecode(sessionStorage.getItem("token")).member_seq // token에서 member_seq 가져오기
    const [isEachFollow, setIsEachFollow] = useState(false);

    useEffect(() => {
        // url에서 가져온 member_id로 해당 페이지 member_id의 데이터 가져오기
        if (member_id) {
            userInfo(member_id).then((resp) => {
                console.log("데이터 : ", resp.data);
                setUser(resp.data);
                // 사용자 정보에서 프로필 이미지 설정
                setSelectedImage(resp.data.member_avatar || profile); // 기본 이미지로 초기화

            }).catch(err => {
                console.log(err);
            })
            findMemberSeq(member_id).then((resp) => {
                console.log("member_seq : ", resp.data);
                setMemberSeq(resp.data); // zustand에 memberSeq 저장
            });
        }
    }, [member_id, setMemberSeq])


    useEffect(() => {
        // 게시물 개수
        countPost(member_id).then((resp) => {
            setPostData(resp.data);
        })
        // 북마크 개수
        countBookmark(member_id).then((resp) => {
            setScrapData(resp.data);
        })
        // 방명록 개수
        countGuestbook(member_id).then((resp) => {
            setGuestbookData(resp.data);
        })
    }, [])

    // ref를 사용하여 파일 input 클릭
    const handleFileInputClick = () => {
        fileInputRef.current.click();
    };

    // 서버로 이미지 업로드 함수
    const handleUploadImage = (file) => {
        uploadProfileImage(file, memberSeq).then(resp => {
            console.log('이미지 업로드 성공:', resp.data)

            // 업로드 후 상태 업데이트
            setSelectedImage(resp.data) // 서버에서 반환된 이미지 URL로 업데이트
            sessionStorage.setItem("member_avatar", resp.data);
            setCurrentUser({ ...currentUser, "member_avatar": resp.data });
        })
            .catch(error => {
                console.error('이미지 업로드 실패:', error)
            })
    }

    // 프로필 사진 삭제
    const handleDeleteProfileImage = () => {
        deleteProfileImage(memberSeq).then(resp => {
            if (resp.data > 0) {
                Swal.fire({
                    title: "프로필 삭제",
                    text: `프로필 사진이 삭제되었습니다.`,
                    icon: "success",
                    confirmButtonText: "확인",
                });
            }
            console.log('이미지 삭제 성공:', resp.data)
            setSelectedImage(profile) // 기본 이미지로 변경
        })
            .catch(error => {
                console.error('이미지 삭제 실패:', error)
            })
    }

    // 팔로워, 팔로잉 수
    useEffect(() => {
        if (memberSeq > 0) {
            getCountFollow(memberSeq).then(resp => {
                setCountFollow(resp.data);
            })
        }
    }, [memberSeq])


    // 팔로워, 팔로잉 목록 출력
    const handleFollow = (memberSeq, type) => {
        if (type === "follower") {
            getFollower(memberSeq).then(resp => {
                console.log("팔로워 목록 : ", resp.data)
                setFollowerData(resp.data);
            })
        } else if (type === "following") {
            getFollowing(memberSeq).then(resp => {
                console.log("팔로잉 목록 : ", resp.data)
                setFollowingData(resp.data);
            })
        }
    }


    // 팔로우, 팔로잉 상태 변경 
    const handleIsFollowing = (targetMemberSeq) => {
        toggleFollow({
            from_member_seq: session_member_seq, // 로그인한 사용자의 member_seq
            to_member_seq: targetMemberSeq, // 팔로우할 대상의 member_seq (팔로잉 취소)
            checkStatus: false, // 팔로우 상태 변경 

        }).then(resp => {
            // 팔로우 상태 업데이트
            setFollowerData(prevList =>
                prevList.map(item =>
                    item.MEMBER_SEQ === targetMemberSeq
                        ? { ...item, IS_FOLLOWING: resp.data.isFollowing ? "Y" : "N" }
                        : item
                )
            )
            // 팔로잉 상태 업데이트 
            setFollowingData(prevList =>
                prevList.map(item =>
                    item.MEMBER_SEQ === targetMemberSeq
                        ? { ...item, IS_FOLLOWING: resp.data.isFollowing ? "Y" : "N" }
                        : item
                )
            )
            // 팔로워, 팔로잉 수 업데이트
            getCountFollow(memberSeq).then(resp => {
                setCountFollow(resp.data); // 팔로워, 팔로잉 수 업데이트
            });
        })
    }

    // useEffect(() => {
    //     handleIsFollowing()
    // }, [memberSeq, session_member_seq])

    useEffect(() => {
        if (memberSeq > 0 && session_member_seq > 0) {
            const params = { from_member_seq: session_member_seq, to_member_seq: memberSeq };

            api.post(`/member/eachFollow`, params).then(resp => {
                console.log("결과 :::: ", resp.data);
                setIsEachFollow(resp.data);
            });

        }

    }, [memberSeq, followerData, followingData])



    // 팔로우 목록에서 사용자 클릭 시 페이지 이동
    const handleMovePage = (memberId) => {
        navi(`/mypage/main/${memberId}/post`);
        setIsModalOpen(false);
    }



    return (
        <div className={styles.container}>
            {/* 배너 이미지: 사용자 본인일 때만 변경 가능 */}
            <div
                className={styles.bannerImg}
                onClick={() => {
                    if (sessionStorage.getItem('member_id') === user.member_id) {
                        setModalContent('banner')
                        setIsModalOpen(true)
                    }
                }}
                style={{ cursor: sessionStorage.getItem('member_id') === user.member_id ? 'pointer' : 'default' }}
            >
                <img src={banner}></img>
            </div>
            <div className={styles.mainBox}>
                <div className={styles.header}>
                    {/* 프로필 이미지: 사용자 본인일 때만 변경 가능 */}
                    <div
                        className={styles.profile}
                        onClick={() => {
                            if (sessionStorage.getItem('member_id') === user.member_id) {
                                setModalContent('profile')
                                setIsModalOpen(true)
                            }
                        }}
                        style={{ cursor: session_member_id === user.member_id ? 'pointer' : 'default' }}
                    >
                        <img src={selectedImage} alt="Profile" />
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.top}>
                            <div className={styles.nickname}>
                                {user.nickname}
                            </div>
                            <div className={styles.linkBtns}>
                                {sessionStorage.getItem('member_id') ===
                                    user.member_id && (
                                        <>
                                            <button className={styles.infoUpdate} onClick={() => navi('/mypage/update')} >
                                                수정
                                            </button>
                                            {/* <button className={styles.mypage} onClick={() => navi('/mypage/userDashboard')} > */}
                                            <button className={styles.mypage} onClick={() => navi('/history/buyList')} >
                                                마이페이지
                                            </button>
                                        </>
                                    )}
                            </div>
                        </div>
                        <div className={styles.middle}>
                            <span className={styles.id}>@{user.member_id}</span>
                            <div className={styles.follower}>
                                <span className={styles.followText}> 팔로워 </span>
                                <span className={styles.followCount}
                                    onClick={() => { handleFollow(memberSeq, "follower"); setModalContent('follower'); setIsModalOpen(true) }}>{countFollow.FOLLOWER}</span>
                            </div>
                            <div className={styles.following}>
                                <span className={styles.followText}> 팔로잉 </span>
                                <span className={styles.followCount}
                                    onClick={() => { handleFollow(memberSeq, "following"); setModalContent('following'); setIsModalOpen(true) }}>{countFollow.FOLLOWING}</span>
                            </div>
                        </div>
                        <div className={styles.bottom}>
                            {
                                session_member_id != user.member_id ?  // 본인일 때 표시 X
                                    <>
                                        {
                                            // 내가 팔로우한 상태라면 "팔로우 -" / 팔로우 하지 않은 상태라면 "팔로우 +"
                                            isEachFollow ?
                                                <button className={styles.delFollowBtn} onClick={() => handleIsFollowing(memberSeq)}> 팔로우 - </button>
                                                :
                                                <button className={styles.addFollowBtn} onClick={() => handleIsFollowing(memberSeq)}> 팔로우 + </button>
                                        }
                                    </>
                                    :
                                    <></>
                            }
                        </div>
                    </div>
                </div>
                <div className={styles.menus}>
                    <div className={styles.menu} onClick={() => navi(`/mypage/main/${member_id}/post`)} >
                        <div className={location.pathname.includes('post') ? styles.active : ''} >
                            <i className="bx bx-grid"></i>
                            <span>게시물</span>
                        </div>
                    </div>
                    <div className={styles.menu} onClick={() => navi(`/mypage/main/${member_id}/scrap`)} >
                        <div className={location.pathname.includes('scrap') ? styles.active : ''} >
                            <i className="bx bx-bookmark"></i>
                            <span>스크랩</span>
                        </div>
                    </div>
                    <div className={styles.menu} onClick={() => navi(`/mypage/main/${member_id}/guestbook`)} >
                        <div className={location.pathname.includes('guestbook') ? styles.active : ''} >
                            <i className="bx bx-message-dots"></i>
                            <span>방명록</span>
                        </div>
                    </div>
                </div>

                {/* 바뀌는 부분 */}
                <div className={styles.body}>
                    <Routes>
                        <Route path="/" element={<Navigate to="post" replace />} />
                        <Route path="post" element={postData > 0 ? <Post data={postData} /> : <><Post data={postData} /> <TextBox text="게시물" /></>} />
                        <Route path="scrap" element={scrapData > 0 ? <Scrap data={scrapData} /> : <><Scrap data={scrapData} /><TextBox text="스크랩" /></>} />
                        <Route path="guestbook" element={guestbookData > 0 ? <Guestbook data={guestbookData} /> : <><Guestbook data={guestbookData} /><TextBox text="방문글" /></>} />
                    </Routes>
                </div>
            </div>

            {/* 모달 컴포넌트 */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* 프로필 사진 변경 */}
                {modalContent === 'profile' && (
                    <div className={styles.modalBox}>
                        <h2>프로필 사진 변경</h2>
                        <div>
                            <button className={styles.modBtn} onClick={handleFileInputClick}>수정</button>
                            <button className={styles.delBtn} onClick={() => {
                                handleDeleteProfileImage(); // 서버에 이미지 삭제 요청
                                setIsModalOpen(false);
                            }}>삭제</button>
                        </div>
                        <input
                            ref={fileInputRef} // ref 할당
                            type="file"
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={e => {
                                const file = e.target.files[0]
                                if (file) {
                                    const reader = new FileReader()
                                    reader.onloadend = () => {
                                        handleUploadImage(file); // 이미지 서버로 전송
                                    };
                                    reader.readAsDataURL(file);
                                }
                                setIsModalOpen(false) // 모달 닫기
                            }}
                        />
                    </div>
                )}
                {/* 배너 사진 변경 */}
                {modalContent === 'banner' && (
                    <div className={styles.modalBox}>
                        <h2>배너 사진 변경</h2>
                        <p>사진은 1470 * 260 사이즈를 권장합니다</p>
                        <div>
                            <button className={styles.modBtn}>수정</button>
                            <button
                                className={styles.delBtn}
                                onClick={() => setIsModalOpen(false)}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                )}
                {/* 팔로워 목록 */}
                {modalContent === 'follower' && (
                    <div className={styles.followListBox}>
                        <h2>팔로워 목록</h2>
                        {followerData.map((follower, i) => {
                            return (
                                <div className={styles.followList} key={i}>
                                    <div className={styles.followImg}>
                                        <img src={follower.MEMBER_AVATAR || profile} />
                                    </div>
                                    <span onClick={() => handleMovePage(follower.MEMBER_ID)}>{follower.NICKNAME}</span>
                                    {
                                        follower.MEMBER_ID !== session_member_id ?
                                            (
                                                follower.IS_FOLLOWING == "Y" ?
                                                    <button className={styles.followingBtn} onClick={() => handleIsFollowing(follower.MEMBER_SEQ)}>팔로잉</button>
                                                    :
                                                    <button className={styles.followerBtn} onClick={() => handleIsFollowing(follower.MEMBER_SEQ)}>팔로우</button>
                                            )
                                            : (
                                                <></>
                                            )
                                    }
                                </div>
                            )
                        })}
                    </div>
                )}
                {/* 팔로잉 목록 */}
                {modalContent === 'following' && (
                    <div className={styles.followListBox}>
                        <h2>팔로잉 목록</h2>
                        {followingData.map((following, i) => {
                            return (
                                <div className={styles.followList} key={i}>
                                    <div className={styles.followImg}>
                                        <img src={following.MEMBER_AVATAR || profile} />
                                    </div>
                                    <span onClick={() => handleMovePage(following.MEMBER_ID)}>{following.NICKNAME}</span>
                                    {
                                        following.MEMBER_ID !== session_member_id ?
                                            (following.IS_FOLLOWING == "Y" ?
                                                <button className={styles.followingBtn} onClick={() => handleIsFollowing(following.MEMBER_SEQ)}>팔로잉</button>
                                                :
                                                <button className={styles.followerBtn} onClick={() => handleIsFollowing(following.MEMBER_SEQ)}>팔로우</button>)

                                            : (
                                                <></>
                                            )
                                    }
                                </div>
                            )
                        })}
                    </div>
                )}
            </Modal>

        </div >
    )
}