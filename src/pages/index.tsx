import React, {useRef} from 'react';
import { useState, useEffect } from 'react';
import axios from "axios";

// import toastify
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// import fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNoteSticky as regularNoteSticky } from '@fortawesome/free-regular-svg-icons';
import { faNoteSticky as solidNoteSticky } from '@fortawesome/free-solid-svg-icons';
// import { faNoteSticky } from '@fortawesome/free-regular-svg-icons'; 
// import { faInstagram, faGithub, faFacebook, faLinkedin } from '@fortawesome/free-brands-svg-icons';

// import loader
import { Oval } from 'react-loader-spinner';  

// import components
import NotesModal from "../components/notesModal"

// import ENVIROMENTAL VAR
import { API_URL } from '../assets/ts/apiConfig'
console.log('API_URL', API_URL);

// import external ts files
import getToken from '../assets/ts/fetchToken'


// Interfaces
interface Data {                  
    jobtype_uuid: string;
    uuid: string;
    name: string;
    done_date: string | null;
    done_user: string;
    in_progress_date: string | null;
    in_progress_user: string;
    notes: string;
}
interface Timestamp {
    done_date: string | null;
    in_progress_date: string | null;
}

interface Timestamps {
    [uuid: string]: Timestamp;
}


function Index() {
    // Define states
    const [loading, setLoading] = useState(true);
    const [TokenValidation, setTokenValidation] = useState<boolean | null>(null);
    const [username, setUsername] = useState<string>("");

    const [data, setData] = useState<Data[]>([]);
    const [latestTimestamps, setLatestTimestamps] = useState<Timestamps>({});
    const [svenskaLag, setSvenskaLag] = useState<Data[]>([]);
    const [matched, setMatched] = useState<Data[]>([]);

    const [sortStatus, setSortStatus] = useState<string>("all");

    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Data[]>([]);

    const [searchString, setSearchString] = useState<string>("");

    const scrollPosition = useRef(0);



    // -------------- FETCHING TOKEN ------------------

    // fetching token from external ts file
    const token = getToken();
    useEffect(() => {
        const getToken = async () => {
          if (token) {
            const validatedToken = await validateToken(token); 
            // setValidationResult(validatedToken);
            console.log('validatedToken', validatedToken);
            if (validatedToken !== null) {
                console.log("TOKEN VALID");
                setTokenValidation(true)
                setUsername(validatedToken.username)
            }else {
                setTokenValidation(false)
            }
          }
        };  
    getToken(); 
    }, [token]); 
    // Validate token 
    const validateToken = async (token: string) => {
        try {
            const response = await axios.get(
            `/api/index.php/rest/auth/validate_token/${token}`,
            {
                headers: {
                'Content-Type': 'application/json',
                },
            }
            );
            console.log('Token response:', response.data.result);
            return response.data.result; 
        } catch (error) {
            console.error('Error validating token:', error);
            return null;
        }
    };





    // METHOD to fetch data
    const fetchData = async () => {
        scrollPosition.current = window.scrollY;
        setLoading(true);
            try {
                const response = await axios.get(`${API_URL}api/get/svenskalag/data`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
                )
                console.log('data', response.data.data);
                setData(response.data.data)

                const updatedTimestamps = getLatestTimestamps(response.data.data);
                setLatestTimestamps(updatedTimestamps);
            } catch (error) {
                console.log('error', error);
            }
            try {
                const response = await axios.get(`${API_URL}api/get/svenskalag/datainsvenskalagcategory`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    params: {
                        portaluuid: "2dba368b-6205-11e1-b101-0025901d40ea"
                    }
                }
                )
                console.log('svenska lag jobtypes', response.data.data);
                setSvenskaLag(response.data.data)
            } catch (error) {
                console.log('error', error);
            }
        window.scrollTo(0, scrollPosition.current);
    }

    // METHOD to extract latest timestamps 
    const getLatestTimestamps = (data: any) => {
        const timestamps: Timestamps = {};
        data.forEach((item: any) => {
            timestamps[item.uuid] = {
                done_date: item.done_date,
                in_progress_date: item.in_progress_date,
            };
        });
        return timestamps;
    };

    // Check if there are any updates by comparing timestamps
    const checkForUpdates = async () => {
        try {
            const response = await axios.get(`${API_URL}api/get/svenskalag/data`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const newData = response.data.data;
            console.log('newData', newData);

            let needsUpdate = false;

            // Compare new data timestamps to the latest stored timestamps
            newData.forEach((item: any) => {
                const storedTimestamp = latestTimestamps[item.uuid];
                if (
                    storedTimestamp &&
                    (storedTimestamp.done_date !== item.done_date ||
                     storedTimestamp.in_progress_date !== item.in_progress_date)
                ) {
                    needsUpdate = true;
                }
            });

            // if any changes are detected
            if (needsUpdate) {
                setData(newData);
                setLatestTimestamps(getLatestTimestamps(newData));
            }
        } catch (error) {
            console.log('Error checking for updates:', error);
        }
    };
    useEffect(() => {
        fetchData(); 
    }, [token]);
    // Periodic check setup
    useEffect(() => {
        const intervalId = setInterval(() => {
            checkForUpdates(); 
        }, 5000);
        return () => clearInterval(intervalId); 
    }, []); 
    
    






    // useEffect(() => {   
    //         if (TokenValidation){
    //             fetchData();
    //             console.log('fetching data');
    //         } else if (TokenValidation == false && TokenValidation !== null) {
    //             console.log("TOKEN MISSING OR INVALID");
    //             toast.error("Token is missing or invalid")
    //             setLoading(false);
    //         }
    // }, [TokenValidation]);
    // // Update every 30 seconds
    // useEffect(() => {
    //     const intervalId = setInterval(() => {
    //         fetchData();
    //     }, 60000); 
    //     return () => clearInterval(intervalId);
    // }, []); 
    


    //merge tables 
    useEffect(() => {
        if (data.length > 0) {
            setLoading(false);
            const matchedData = data.filter(item => 
                svenskaLag.some(s => s.jobtype_uuid === item.jobtype_uuid)
              );
            console.log('matched', matchedData);
            setMatched(matchedData)
        }
      }, [svenskaLag, data]);

       // METHOD to set none
       const setNone = async (uuid: string) => {
        console.log('uuid', uuid);
        const data = {
            project_uuid: uuid,
            portaluuid: "2dba368b-6205-11e1-b101-0025901d40ea",
            username: username
        }
        try {
            const response = await axios.put(`${API_URL}api/put/setnone`, data, {
                headers: {
                    "Content-type": "application/json"
                }
            })
            console.log('response', response);
            fetchData();
            toast.success("Project set to 'None' successfully!")
        } catch (error) {
            console.log('error', error);
        }   
        console.log('data', data);
    };

      // METHOD to set Inprogress
      const setInProgress = async (uuid: string) => {
        console.log('uuid', uuid);
        const data = {
            project_uuid: uuid,
            portaluuid: "2dba368b-6205-11e1-b101-0025901d40ea",
            username: username
        }
        try {
            const response = await axios.put(`${API_URL}api/put/setinprogress`, data, {
                headers: {
                    "Content-type": "application/json"
                }
            })
            console.log('response', response);
            fetchData();
            toast.success("Project set to 'In Progress' successfully!")
        } catch (error) {
            console.log('error', error);
        }   
        console.log('data', data);
    };

    // METHOD to set Done
    const setDone = async (uuid: string) => {
        console.log('uuid', uuid);
        const data = {
            project_uuid: uuid,
            portaluuid: "2dba368b-6205-11e1-b101-0025901d40ea",
            username: username
        }
        try {
            const response = await axios.put(`${API_URL}api/put/setdone`, data, {
                headers: {
                    "Content-type": "application/json"
                }
            })
            console.log('response', response);
            fetchData();
            toast.success("Project set to 'Done' successfully!")
        } catch (error) {
            console.log('error', error);
        }   
        console.log('data', data);
    };



    // Sort table based on status all, in progress, done
    const sortTableStatus = (status: string) => {
    console.log('status:', status);
    setSortStatus(status);
    };



    // Filter the matched items based on the sortStatus
    const filteredItems = matched.filter(item => {
        if (sortStatus === "in progress") {
            return item.in_progress_date !== null && item.done_date === null;
        } else if (sortStatus === "done") {
            // return item.done_date !== null;
           return item.done_date && (!item.in_progress_date || new Date(item.done_date) > new Date(item.in_progress_date))
        }
        return true; 
    });



    // Handle search
    const handleSearchInput = (search: string) => {
        console.log('search', search);
        setSearchString(search);
    };

    

    // Modal methods
    const handleOpenModal = (item: any) => {
        console.log(item);
        setSelectedProject(item);
        setShowNotesModal(true);
    }
    const closeModal = () => {
        setShowNotesModal(false);
    } 
    const handleSuccess = () => {
        toast.success("Notes updated successfully!"); 
        fetchData();
    };




    // If missing token SHOW:
    if (TokenValidation === false) {
        return (
            <div className='wrapper' >
            <h2 style={{ color: '#ff4d4d', marginBottom: '10px' }}>Missing or Invalid Token</h2>
            <h5 style={{ color: '#666', marginBottom: '20px' }}>
                Please contact IT if the issue persists.
            </h5>
            <button 
                onClick={() => window.location.reload()} 
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Refresh Page
            </button>
        </div>
        );
    }

    return (
    <div>

        <div className='jobtype-header-wrapper'>
            <div className=''>
                <h1>Svenska Lag Check</h1>
                {/* <h5>Lorem impus dium opsom...</h5> */}
            </div> 
        </div>

        <div className='wrapper'> 
            <div className='d-flex'>
                <div className='button-box'>
                    <button className={`${sortStatus === "all" ? "all" : "table-button"}`} onClick={()=>sortTableStatus("all")} >All</button>
                    <button className={`${sortStatus === "in progress" ? "in-progress" : "table-button"}`} onClick={()=>sortTableStatus("in progress")} >In progress</button>
                    <button className={`${sortStatus === "done" ? "done" : "table-button"}`}  onClick={()=>sortTableStatus("done")}>Done</button>
                </div>
                <table className='table'>
                    <thead>
                        <tr>
                            {/* <th>UUID</th> */}
                            <th>Status</th>
                            <th>Project Name
                            <input
                                    className={`ml-3 search-box ${searchString ? "border-search-box" : ""}`}
                                    placeholder='Search..'
                                    onChange={(e)=>handleSearchInput(e.target.value)}
                                ></input>
                            </th>
                            <th>Change Status</th>
                            <th>Status User</th>
                            <th>Status Date</th>
                            {/* <th></th> */}
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td style={{ 
                                textAlign: 'center', 
                                height: '100px', 
                                width: '1170%',
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center' 
                            }}>
                                <Oval
                                    height={50}
                                    width={50}
                                    color="#cbd1ff"
                                    visible={true}
                                    ariaLabel="loading-indicator"
                                />
                            </td>
                        </tr>
                    ) : (
                        filteredItems.length > 0 ? filteredItems.filter(item => new RegExp(searchString, "i").test(item.name))
                        .map(item => (
                            <tr key={item.uuid}>
                                {/* <td>{item.uuid}</td> */}
                                <td className={`row-status ${
                                    item.done_date && (!item.in_progress_date || new Date(item.done_date) > new Date(item.in_progress_date))
                                        ? "project-done"
                                        : item.in_progress_date && (!item.done_date || new Date(item.in_progress_date) > new Date(item.done_date))
                                        ? "project-inprogress"
                                        : "project-none"
                                }`}>
                                    {/* {item.done_date && item.done_date ? "DONE" : item.in_progress_date ? "IN PROGRESS" : ""} */}
                                    {item.done_date && (!item.in_progress_date || new Date(item.done_date) > new Date(item.in_progress_date))
                                    ? "DONE"
                                    : item.in_progress_date
                                    ? "IN PROGRESS"
                                    : ""}
                                </td>
                                <td className='row-projectname'>{item.name}</td>
                                <td>
                                    <select
                                        title="Set Project Status"
                                        className="status-select"
                                        onChange={(e) => {
                                            e.preventDefault();
                                            const selectedStatus = e.target.value;
                                            if (selectedStatus === "In Progress") {
                                                setInProgress(item.uuid);
                                            } else if (selectedStatus === "Done") {
                                                setDone(item.uuid);
                                            } else if (selectedStatus === "None"){
                                                setNone(item.uuid)
                                            }
                                        }}
                                        defaultValue={item.done_date && (!item.in_progress_date || new Date(item.done_date) > new Date(item.in_progress_date)) ? "Done" : item.in_progress_date && (!item.done_date || new Date(item.in_progress_date) > new Date(item.done_date)) ? "In Progress" : ""} 
                                    >
                                        <option value="" disabled>Select Status</option>
                                        <option value="None">None</option> 
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </td>   
                                <td>
                                    {item.done_date ? item.done_user
                                        : item.in_progress_date ? item.in_progress_user 
                                        : ""}
                                </td>
                                <td>
                                    {item.done_date ? item.done_date.substring(0,10)
                                        : item.in_progress_date ? item.in_progress_date.substring(0,10)
                                        : ""}
                                </td>
                                {/* <td>
                                    <button title='Set Status to In Progress' onClick={() => setInProgress(item.uuid)}>In progress</button>
                                </td> */}
                                {/* <td>
                                    <button title='Set Status to In Progress' className='mr-1 in-progress-status-button' onClick={() => setInProgress(item.uuid)}>In Progress</button>
                                    <button title='Set Status to Done' className='done-status-button' onClick={() => setDone(item.uuid)}>Done</button>
                                </td> */}
                                <td>
                                    <button title='Open Notes' className={`notes-table-button`} onClick={() => handleOpenModal(item)}>{item.notes ? <FontAwesomeIcon icon={solidNoteSticky} /> : <FontAwesomeIcon icon={regularNoteSticky} />}
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td style={{ textAlign: 'center', padding: '20px' }}>
                                    No data available
                                </td>
                            </tr>
                        )
                    )}
                </tbody>

                </table>
            </div>    
        </div>

            {showNotesModal && (
                < NotesModal show={showNotesModal} onClose={closeModal} onSucces={handleSuccess} selectedProject={selectedProject}/>
            )}        
            
            <ToastContainer
                position="bottom-left"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={true}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light" // light, dark, colored
                style={{ width: "500px", height: "50px", fontSize: "1.1rem", marginBottom: "3em", marginLeft: "1em" }}
                // toastClassName="custom-toast"
                // bodyClassName="custom-toast-body"
            />

    </div>
    );
}

export default Index;
