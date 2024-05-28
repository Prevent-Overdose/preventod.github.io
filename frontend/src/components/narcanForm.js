
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import './narcanForm.css';
import { TextField } from '@mui/material/';

const NarcanForm = () => {
  const [formData, setFormData] = useState({
    organizationName: '',
    state: '',
    county: '',
    address: '',
    phoneNumber: '',
    email: '',
    boxesOfNarcan: '',
    availability: [
      { date: null, startTime: null, endTime: null },
      { date: null, startTime: null, endTime: null },
      { date: null, startTime: null, endTime: null }],
    fatalOverdoses: '',
    nonFatalOverdoses: '',
    reversedOverdoses: '',
  });
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      const formattedPhoneNumber = formatPhoneNumber(value);
      setFormData({ ...formData, [name]: formattedPhoneNumber });
    } else {
      const numericFields = ['boxesOfNarcan', 'fatalOverdoses', 'nonFatalOverdoses', 'reversedOverdoses'];
      if (numericFields.includes(name)) {
        const numericValue = value === '' ? '' : Math.max(0, parseInt(value, 10));
        if (!isNaN(numericValue) && Number.isInteger(numericValue)) {
          setFormData({ ...formData, [name]: numericValue });
        }
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
  };

  const handleDateChange = (index, date) => {
    const newAvailability = formData.availability.map((avail, i) => {
      if (i === index) {
        return { ...avail, date };
      }
      return avail;
    });
    setFormData({ ...formData, availability: newAvailability });
  };

  const handleTimeChange = (index, time, timeType) => {
    const newAvailability = formData.availability.map((avail, i) => {
      if (i === index) {
        if (timeType === 'startTime' && avail.endTime && time > avail.endTime) {
          setError('Start time cannot be after end time');
          return avail;
        }
        if (timeType === 'endTime' && avail.startTime && time < avail.startTime) {
          setError('End time cannot be before start time');
          return avail;
        }
        setError(null);
        return { ...avail, [timeType]: time };
      }
      return avail;
    });
    setFormData({ ...formData, availability: newAvailability });
  };

  const addAvailability = () => {
    setFormData({
      ...formData,
      availability: [...formData.availability, { date: null, startTime: null, endTime: null }]
    });
  };

  const deleteAvailability = (index) => {
    const newAvailability = formData.availability.filter((_, i) => i !== index);
    setFormData({ ...formData, availability: newAvailability });
  };

  const formatAvailabilityForBackend = (availability) => {
    return availability.map((avail) => ({
      ...avail,
      date: moment(avail.date).format('YYYY-MM-DD'),
      startTime: moment(avail.startTime).format('h:mm A'),
      endTime: moment(avail.endTime).format('h:mm A')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(formData.availability.length < 3){
      setError('Please provide at least 3 dates of availability.')
      return
    }

    for (const avail of formData.availability) {
      if (avail.startTime && avail.endTime && avail.startTime >= avail.endTime) {
        setError('End time cannot be earlier than or the same as start time.');
        return;
      }
    }

    const formattedFormData = {
      ...formData,
      availability: formatAvailabilityForBackend(formData.availability),
    };

    try {
      const response = await fetch("https://prevent-overdose-github-io.onrender.com/api/narcan", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedFormData)
      });
      if (!response.ok) {
        throw new Error('Failed to submit the form');
      }
      const result = await response.json();
      console.log('Form submitted successfully:', result);
      setFormData({
        organizationName: '',
        state: '',
        county: '',
        address: '',
        phoneNumber: '',
        email: '',
        boxesOfNarcan: '',
        availability: [{ date: null, startTime: null, endTime: null }],
        fatalOverdoses: '',
        nonFatalOverdoses: '',
        reversedOverdoses: '',
      });
      setError(null);
      setSubmitted(true);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="formcontainer">
      <form className="create" onSubmit={handleSubmit}>
        <h4><strong>Send a Request</strong></h4>
        <div>
          <p className='form-info'>
            This is a form to receive bulk shipments of free 
            Narcan, monthly. Our Narcan is supplied by state-specific government agencies. 
            Currently available in <strong>Allegheny county, PA;
            Hillsborough county, FL; 
            Pinellas county, FL; 
            Alachua county, FL. </strong>
            If not available in your area, 
            contact us through our website. 
          </p>
        </div>
        <div>
          <span>What is your organization's name?</span>
          <TextField
            type="text"
            name="organizationName"
            value={formData.organizationName}
            placeholder=" ex. Prevent Overdose Inc."
            onChange={handleChange}
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <span>What state is your organization located in?</span>
          <TextField
            type="text"
            name="state"
            value={formData.state}
            placeholder=" ex. Florida"
            onChange={handleChange}
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <span>What county is your organization located in?</span>
          <TextField
            type="text"
            name="county"
            value={formData.county}
            placeholder=" ex. Hillsborough"
            onChange={handleChange}
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <span>Provide an address that can serve as the meeting point to receive Narcan shipments:</span>
          <TextField
            type="text"
            name="address"
            value={formData.address}
            placeholder=" Enter address"
            onChange={handleChange}
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <span>Provide a phone number within your organization that can respond to monthly Narcan:</span>
          <TextField
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            placeholder=" Enter phone number"
            onChange={handleChange}
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <span>Provide an email to contact the organization:</span>
          <TextField
            type="email"
            name="email"
            value={formData.email}
            placeholder=" ex. example@gmail.com"
            onChange={handleChange}
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <span>How many boxes of Narcan do you need?</span>
          <TextField
            type="number"
            name="boxesOfNarcan"
            value={formData.boxesOfNarcan}
            placeholder=" Enter number"
            onChange={handleChange}
            min="0"
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <label>What is your availability this month? (add at least three dates)</label>
          {formData.availability.map((avail, index) => (
            <div key={index}>
              <DatePicker
                selected={avail.date}
                onChange={(date) => handleDateChange(index, date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select a date"
                required
              />
              <DatePicker
                selected={avail.startTime}
                onChange={(time) => handleTimeChange(index, time, 'startTime')}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Start Time"
                dateFormat="h:mm aa"
                placeholderText="Select start time"
                required
              />
              <DatePicker
                selected={avail.endTime}
                onChange={(time) => handleTimeChange(index, time, 'endTime')}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="End Time"
                dateFormat="h:mm aa"
                placeholderText="Select end time"
                required
              />
              <button type="button" onClick={() => deleteAvailability(index)}>Delete</button>
            </div>
          ))}
          <button type="button" onClick={addAvailability}>Add Availability</button>
        </div>
        <br />
        <div>
          <span>How many fatal overdoses have you seen in the past month?</span>
          <TextField
            type="number"
            name="fatalOverdoses"
            value={formData.fatalOverdoses}
            placeholder=" Enter number"
            onChange={handleChange}
            min="0"
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <span>How many non-fatal overdoses have you seen in the past month?</span>
          <TextField
            type="number"
            name="nonFatalOverdoses"
            value={formData.nonFatalOverdoses}
            placeholder=" Enter number"
            onChange={handleChange}
            min="0"
            required
            style={{ background: 'black' }}
          />
        </div>
        <br />
        <div>
          <span>How many overdoses have you reversed with Narcan in the past month?</span>
          <TextField
            type="number"
            name="reversedOverdoses"
            value={formData.reversedOverdoses}
            placeholder=" Enter number"
            onChange={handleChange}
            min="0"
            required
            style={{ background: 'black' }}
          />
        </div>
        <div className="submit-button">
          <button type="submit" >Submit Request</button>
        </div>
        {submitted && (
          <p className='confirmation-message'>
            We will send a text message to confirm 
            that your order has been received and 
            will update you with the progress of the order 
            through the phone number provided. 
          </p>
        )}
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
};

export default NarcanForm;