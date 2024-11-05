import React, {useState} from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

import 'bootstrap/dist/css/bootstrap.min.css';

// import fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNoteSticky as regularNoteSticky } from '@fortawesome/free-regular-svg-icons';
import { faNoteSticky as solidNoteSticky } from '@fortawesome/free-solid-svg-icons';


import { API_URL } from '../assets/ts/apiConfig'
console.log('API_URL', API_URL);


interface ShowCategoryModalProps {
    show: boolean;
    onClose: () => void;
    selectedProject: any;
    onSucces: () => void;
}

const notesModal: React.FC<ShowCategoryModalProps> = ({ show, onClose, onSucces, selectedProject}) => {
    // define states
    const [newNotes, setNewNotes] = useState("");
    const [errorBorder, setErrorBorder] = useState(false);


    console.log('selectedProject', selectedProject);

    // handle input 
    const handleInput = (e: string) => {
        console.log('categoryName', e);
        setNewNotes(e);
        setErrorBorder(false);
    };
    
    // METHOD to add new category
    const updateNotes = async () => {
      console.log('notes', newNotes);

        const data = {
            notes: newNotes,
            project_uuid: selectedProject.uuid
        }
        console.log('data', data);
        try {
            const response = await axios.put(`${API_URL}api/put/notessvenskalag`, data, {
                headers: {
                    "Content-type": "Application/json"
                }
            })
            console.log('response', response);
            if (response.status === 200){
                onClose()
                onSucces()
            }
        } catch (error) {
            console.log('error', error);
        }
    //   }
    };



    return (
        <Modal  show={show} onHide={onClose} centered>
            <div className='notes-modal'>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <div className='d-flex'>
                            <h1>
                                {selectedProject.notes ? <FontAwesomeIcon icon={solidNoteSticky} /> : <FontAwesomeIcon icon={regularNoteSticky} /> }
                            </h1>
                            <h4 className='mt-3 ml-3'>Notes</h4>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body >
                    <form>
                        <div className="mb-3">
                            {/* <h6 className="form-label">Notes</h6> */}
                            <div>
                                <textarea className={`textarea ${errorBorder ? "error-border" : ""}`} id="categoryName" placeholder='Notes..' defaultValue={selectedProject.notes}  onChange={(e) => handleInput(e.target.value)} />
                            </div>
                        </div>
                    </form>
                </Modal.Body>
                <div className='mx-3 my-3 d-flex justify-content-center'>
                    <button className='mr-2 close-modal-button' onClick={onClose}>
                        Close
                    </button>
                    <button className='save-modal-button' onClick={() => updateNotes()}>
                      Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default notesModal;
