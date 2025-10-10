import React from 'react';
import { Formik, Form, Field } from 'formik';
import axios from 'axios';

function Dashboard() {
  // Admin token from localStorage
  const token = localStorage.getItem('token'); // JWT issued to admin
  const baseUrl = 'http://localhost:5000/api/vcds';

  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : {};

  const initialAddValues = {
    vcdID: '',
    vcdName: '',
    language: '',
    category: '',
    rating: '',
    quantity: '',
    cost: '',
    vcdImage: ''
  };

  const initialUpdateValues = {
    vcdName: '',
    quantity: '',
    cost: '',
    vcdImage: ''
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: 'auto' }}>
      <h2 style={{ marginBottom: '20px' }}>🎬 Admin Dashboard</h2>

      {/* Add VCD */}
      <section style={{ marginBottom: '40px' }}>
        <h3>Add VCD</h3>
        <Formik
          initialValues={initialAddValues}
          onSubmit={async (values, { resetForm }) => {
            try {
              const res = await axios.post(baseUrl, values, { headers: authHeaders });
              alert(res.data.message || 'VCD added successfully');
              resetForm();
            } catch (err) {
              alert(err.response?.data?.error || 'Failed to add VCD');
            }
          }}
        >
          {({ values }) => (
            <Form>
              {Object.keys(initialAddValues).map((key) => (
                <div key={key} style={{ marginBottom: '10px' }}>
                  <Field
                    name={key}
                    placeholder={key}
                    required={['vcdID', 'vcdName', 'quantity', 'cost', 'vcdImage'].includes(key)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              ))}
              {values.vcdImage && (
                <img src={values.vcdImage} alt="Preview" style={{ width: '150px', marginBottom: '10px' }} />
              )}
              <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                Add VCD
              </button>
            </Form>
          )}
        </Formik>
      </section>

      {/* Delete VCD */}
      <section style={{ marginBottom: '40px' }}>
        <h3>Delete VCD</h3>
        <Formik
          initialValues={{ deleteName: '' }}
          onSubmit={async (values, { resetForm }) => {
            try {
              const res = await axios.delete(`${baseUrl}/by-name/${values.deleteName}`, {
                headers: authHeaders
              });
              alert(res.data.message || 'VCD deleted successfully');
              resetForm();
            } catch (err) {
              alert(err.response?.data?.error || 'Failed to delete VCD');
            }
          }}
        >
          {() => (
            <Form>
              <div style={{ marginBottom: '10px' }}>
                <Field
                  name="deleteName"
                  placeholder="VCD Name to delete"
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                Delete VCD
              </button>
            </Form>
          )}
        </Formik>
      </section>

      {/* Update VCD */}
      <section>
        <h3>Update VCD</h3>
        <Formik
          initialValues={{ updateName: '', ...initialUpdateValues }}
          onSubmit={async (values, { resetForm }) => {
            try {
              const { updateName, ...updateData } = values;
              const res = await axios.patch(`${baseUrl}/by-name/${updateName}`, updateData, {
                headers: authHeaders
              });
              alert(res.data.message || 'VCD updated successfully');
              resetForm();
            } catch (err) {
              alert(err.response?.data?.error || 'Failed to update VCD');
            }
          }}
        >
          {({ values }) => (
            <Form>
              <div style={{ marginBottom: '10px' }}>
                <Field
                  name="updateName"
                  placeholder="VCD Name to update"
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              {Object.keys(initialUpdateValues).map((key) => (
                <div key={key} style={{ marginBottom: '10px' }}>
                  <Field
                    name={key}
                    placeholder={`New ${key}`}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              ))}
              {values.vcdImage && (
                <img src={values.vcdImage} alt="Preview" style={{ width: '150px', marginBottom: '10px' }} />
              )}
              <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                Update VCD
              </button>
            </Form>
          )}
        </Formik>
      </section>
    </div>
  );
}

export default Dashboard;

















// import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { Formik, Form, Field } from 'formik';
 
// function Dashboard() {
//   const navigate = useNavigate();
//   const email = localStorage.getItem('adminEmail');
//   const password = localStorage.getItem('adminPassword');
//   const baseUrl = 'http://localhost:5000/api/vcds';
 
//   const initialAddValues = {
//     vcdID: '',
//     vcdName: '',
//     language: '',
//     category: '',
//     rating: '',
//     quantity: '',
//     cost: '',
//     vcdImage: ''
//   };
 
//   const initialUpdateValues = {
//     vcdName: '',
//     quantity: '',
//     cost: '',
//     vcdImage: ''
//   };
 
//   return (
//     <div style={{ padding: '30px', maxWidth: '800px', margin: 'auto' }}>
//       <h2 style={{ marginBottom: '20px' }}>🎬 Admin Dashboard</h2>
 
//       {/* Add VCD Section */}
//       <section style={{ marginBottom: '40px' }}>
//         <h3>Add VCD</h3>
//         <Formik
//           initialValues={initialAddValues}
//           onSubmit={async (values, { resetForm }) => {
//             try {
//               const res = await axios.post(baseUrl, { email, password, ...values });
//               alert(res.data.message || 'VCD added successfully');
//               resetForm();
//             } catch (err) {
//               alert(err.response?.data?.error || 'Failed to add VCD');
//             }
//           }}
//         >
//           {({ values }) => (
//             <Form>
//               {Object.keys(initialAddValues).map((key) => (
//                 <div key={key} style={{ marginBottom: '10px' }}>
//                   <Field
//                     name={key}
//                     placeholder={key}
//                     required={['vcdID', 'vcdName', 'quantity', 'cost', 'vcdImage'].includes(key)}
//                     style={{ width: '100%', padding: '8px' }}
//                   />
//                 </div>
//               ))}
//               {values.vcdImage && (
//                 <img src={values.vcdImage} alt="Preview" style={{ width: '150px', marginBottom: '10px' }} />
//               )}
//               <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
//                 Add VCD
//               </button>
//             </Form>
//           )}
//         </Formik>
//       </section>
 
//       {/* Delete VCD Section */}
//       <section style={{ marginBottom: '40px' }}>
//         <h3>Delete VCD</h3>
//         <Formik
//           initialValues={{ deleteName: '' }}
//           onSubmit={async (values, { resetForm }) => {
//             try {
//               const res = await axios.delete(`${baseUrl}/by-name/${values.deleteName}`, {
//                 data: { email, password }
//               });
//               alert(res.data.message || 'VCD deleted successfully');
//               resetForm();
//             } catch (err) {
//               alert(err.response?.data?.error || 'Failed to delete VCD');
//             }
//           }}
//         >
//           {({ values }) => (
//             <Form>
//               <div style={{ marginBottom: '10px' }}>
//                 <Field
//                   name="deleteName"
//                   placeholder="VCD Name to delete"
//                   required
//                   style={{ width: '100%', padding: '8px' }}
//                 />
//               </div>
//               <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
//                 Delete VCD
//               </button>
//             </Form>
//           )}
//         </Formik>
//       </section>
 
//       {/* Update VCD Section */}
//       <section>
//         <h3>Update VCD</h3>
//         <Formik
//           initialValues={{ updateName: '', ...initialUpdateValues }}
//           onSubmit={async (values, { resetForm }) => {
//             try {
//               const { updateName, ...updateData } = values;
//               const res = await axios.patch(`${baseUrl}/by-name/${updateName}`, {
//                 email,
//                 password,
//                 ...updateData
//               });
//               alert(res.data.message || 'VCD updated successfully');
//               resetForm();
//             } catch (err) {
//               alert(err.response?.data?.error || 'Failed to update VCD');
//             }
//           }}
//         >
//           {({ values }) => (
//             <Form>
//               <div style={{ marginBottom: '10px' }}>
//                 <Field
//                   name="updateName"
//                   placeholder="VCD Name to update"
//                   required
//                   style={{ width: '100%', padding: '8px' }}
//                 />
//               </div>
//               {Object.keys(initialUpdateValues).map((key) => (
//                 <div key={key} style={{ marginBottom: '10px' }}>
//                   <Field
//                     name={key}
//                     placeholder={`New ${key}`}
//                     style={{ width: '100%', padding: '8px' }}
//                   />
//                 </div>
//               ))}
//               {values.vcdImage && (
//                 <img src={values.vcdImage} alt="Preview" style={{ width: '150px', marginBottom: '10px' }} />
//               )}
//               <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
//                 Update VCD
//               </button>
//             </Form>
//           )}
//         </Formik>
//       </section>
//     </div>
//   );
// }
 
// export default Dashboard;