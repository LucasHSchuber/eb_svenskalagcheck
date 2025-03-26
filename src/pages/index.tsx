import {useRef} from 'react';
import { useState, useEffect } from 'react';
import axios from "axios";

// import toastify
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// import fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNoteSticky as regularNoteSticky } from '@fortawesome/free-regular-svg-icons';
import { faNoteSticky as solidNoteSticky, faArrowUpWideShort, faArrowDownShortWide } from '@fortawesome/free-solid-svg-icons';
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

const ENV = import.meta.env;



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
    last_activity: string | null;
    memberslist: boolean;
}
interface Timestamp {
    done_date: string | null;
    in_progress_date: string | null;
}
interface Timestamps {
    [uuid: string]: Timestamp;
}

interface Memberslist {
    memberslist: boolean;
}
interface Memberslists {
    [uuid: string]: Memberslist;
}


function Index() {
    // Define states
    const [loading, setLoading] = useState(true);
    const [TokenValidation, setTokenValidation] = useState<boolean | null>(null);
    const [username, setUsername] = useState<string>("");

    const [data, setData] = useState<Data[]>([]);
    const [latestTimestamps, setLatestTimestamps] = useState<Timestamps>({});
    const [latestMemberslist, setLatestMemberslist] = useState<Memberslists>({});
    const [svenskaLag, setSvenskaLag] = useState<Data[]>([]);
    const [matched, setMatched] = useState<Data[]>([]);

    const [sortStatus, setSortStatus] = useState<string>("all");
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); 
    const [sortMemberslistDirection, setSortMemberslistDirection] = useState<'asc' | 'desc'>('asc'); 

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
            const response = await axios.get(`${ENV.MODE === "production" ? "https://backend.expressbild.org" : "/api"}/index.php/rest/auth/validate_token/${token}`,{
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
                const updatedMemberslist = getLatestMemberslist(response.data.data);
                console.log('updatedMemberslist', updatedMemberslist);
                setLatestTimestamps(updatedTimestamps);
                setLatestMemberslist(updatedMemberslist);
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
    useEffect(() => {
        fetchData(); 
    }, [token]);




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
                if (storedTimestamp && (storedTimestamp.done_date !== item.done_date || storedTimestamp.in_progress_date !== item.in_progress_date)) {
                    needsUpdate = true;
                }
            });
            console.log('needsUpdate', needsUpdate);
            if (needsUpdate) {
                setData(newData);
                setLatestTimestamps(getLatestTimestamps(newData));
            }
        } catch (error) {
            console.log('Error checking for updates:', error);
        }
    };


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
            // fetchData();
            checkForUpdates()
            toast.success("Status har uppdaterats till 'Nytt'")
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
            // fetchData();
            checkForUpdates();
            toast.success("Status har uppdaterats till 'Pågående'")
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
            // fetchData();
            checkForUpdates();
            toast.success("Status har uppdaterats till 'Klart'")
        } catch (error) {
            console.log('error', error);
        }   
        console.log('data', data);
    };




    //  --------------- SORTING TABLE --------------

    const sortTable = (column: string) => {
        const sortedData = [...matched];
        let direction: 'asc' | 'desc';
        
        if (column === 'last_activity') {
            direction = sortDirection === 'asc' ? 'desc' : 'asc';
            sortedData.sort((a, b) => {
                const dateA = new Date(a.last_activity ?? 0).getTime();
                const dateB = new Date(b.last_activity ?? 0).getTime();
                return direction === 'asc' ? dateA - dateB : dateB - dateA;
            });
            setSortDirection(direction); 
        }
    
        if (column === 'memberslist') {
            direction = sortMemberslistDirection === 'asc' ? 'desc' : 'asc';
            sortedData.sort((a, b) => {
                const valueA = Number(a.memberslist ?? 0); 
                const valueB = Number(b.memberslist ?? 0);
                return direction === 'asc' ? valueA - valueB : valueB - valueA;
            });
            setSortMemberslistDirection(direction); 
        }
    
        setData(sortedData); 
    };
    


    // Sort table based on status all, in progress, done
    const sortTableStatus = (status: string) => {
    console.log('status:', status);
    setSortStatus(status);
    };

    // Filter the matched items based on the sortStatus
    const filteredItems = matched.filter(item => {
        if (sortStatus === "in progress") {
            const inProgressDate = item.in_progress_date ? new Date(item.in_progress_date) : null;
            const doneDate = item.done_date ? new Date(item.done_date) : null;
            return inProgressDate && (!doneDate || inProgressDate > doneDate);
        } else if (sortStatus === "done") {
            const doneDate = item.done_date ? new Date(item.done_date) : null;
            const inProgressDate = item.in_progress_date ? new Date(item.in_progress_date) : null;
            return doneDate && (!inProgressDate || doneDate > inProgressDate);
        }
        return !item.done_date && !item.in_progress_date;
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
        toast.success("Anteckningar har uppdaterats"); 
        fetchData();
    };






    // Checkbox change - Update memeberslist in db
    const handleCheckboxChange = async (e: any, uuid: any) => {
        console.log('e', e.target.checked);
        console.log('uuid', uuid);
        const updatedData = {
            project_uuid: uuid,
            status: e.target.checked === true ? "1" : "0"
        } 
        try {
            const responseCheck = await axios.put(`${API_URL}api/put/checkmemberslist`, updatedData, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            console.log('responseCheck', responseCheck);
            if (responseCheck.status === 200){
                console.log('Updated');
                checkForUpdatedMemberslist();
                toast.success("Medlemslistan uppdaterad")
            } else {
                console.log('Failed');
                toast.error("Misslyckades, försök igen");

            }
        } catch (error) {
            console.log('Error when checking memberslist', error);
        }
    };

    // METHOD to extract latest timestamps 
    const getLatestMemberslist = (data: any) => {
        const memberslist: Memberslists = {};
        data.forEach((item: any) => {
            memberslist[item.uuid] = {
                memberslist: item.memberslist,
            };
        });
        return memberslist;
    };

    // Check if there are any updates by comparing timestamps
    const checkForUpdatedMemberslist = async () => {
        try {
            const response = await axios.get(`${API_URL}api/get/svenskalag/data`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const newData = response.data.data;
            console.log('newData', newData);

            let needsUpdate = false;
            // Compare
            newData.forEach((item: any) => {
                const storedList = latestMemberslist[item.uuid];
                if (
                    storedList &&
                    (storedList.memberslist !== item.memberslist)
                ) {
                    needsUpdate = true;
                }
            });
            // if any changes are detected
            if (needsUpdate) {
                setData(newData);
                setLatestMemberslist(getLatestMemberslist(newData));
            }
        } catch (error) {
            console.log('Error checking for updates:', error);
        }
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
                    <button className={`${sortStatus === "all" ? "all" : "table-button"}`} onClick={()=>sortTableStatus("all")} >Nytt</button>
                    <button className={`${sortStatus === "in progress" ? "in-progress" : "table-button"}`} onClick={()=>sortTableStatus("in progress")} >Pågående</button>
                    <button className={`${sortStatus === "done" ? "done" : "table-button"}`}  onClick={()=>sortTableStatus("done")}>Klart</button>
                </div>
                <table className='table'>
                    <thead>
                        <tr>
                            {/* <th>UUID</th> */}
                            <th>Status</th>
                            <th>Projektnamn
                            <input
                                    className={`ml-3 search-box ${searchString ? "border-search-box" : ""}`}
                                    placeholder='Search..'
                                    onChange={(e)=>handleSearchInput(e.target.value)}
                                ></input>
                            </th>
                            <th className='last_activity-th' title='Sortera efter senaste aktivitet' onClick={() => sortTable("last_activity")}>Senaste Aktivitet {sortDirection === "asc" ? <FontAwesomeIcon icon={faArrowDownShortWide} className='last_activity-th-icon' /> : <FontAwesomeIcon icon={faArrowUpWideShort} className='last_activity-th-icon' />} </th>
                            <th>Ändra Status</th>
                            <th title='Sortera efter medlemslista' onClick={() => sortTable("memberslist")} className='memberslist-th'>Medlemslista {sortMemberslistDirection === "asc" ? <FontAwesomeIcon icon={faArrowDownShortWide} className='last_activity-th-icon' /> : <FontAwesomeIcon icon={faArrowUpWideShort} className='last_activity-th-icon' />}</th>
                            <th>Uppdaterad av</th>
                            <th>Datum</th>
                            {/* <th></th> */}
                            <th>Anteckningar</th>
                        </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td style={{ 
                                textAlign: 'center', 
                                height: '100px', 
                                width: '1770%',
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
                                    ? "KLART"
                                    : item.in_progress_date
                                    ? "PÅGÅENDE"
                                    : "NYTT"}
                                </td>
                                <td className='row-projectname'>{item.name}</td>
                                <td>{item.last_activity?.substring(0,10)}</td>
                                <td>
                                    <select
                                        title="Ändra status"
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
                                        <option value="" disabled>Ändra Status</option>
                                        <option value="None" style={{ backgroundColor: "#e7e7e7" }}>Nytt</option> 
                                        <option value="In Progress" style={{ backgroundColor: "yellow" }}>Pågående</option>
                                        <option value="Done" style={{ backgroundColor: "#00ff15" }}>Klart</option>
                                    </select>
                                </td>   
                                <td className=''>
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        className="checkbox "
                                        onChange={(e) => handleCheckboxChange(e, item.uuid)}
                                        checked={item.memberslist || false}
                                    />
                                    <span className="checkmark"></span>
                                </label>
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
                                <td>
                                    <button title='Öppna anteckningar' className={`notes-table-button`} onClick={() => handleOpenModal(item)}>{item.notes ? <FontAwesomeIcon icon={solidNoteSticky} /> : <FontAwesomeIcon icon={regularNoteSticky} />}
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td>
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
