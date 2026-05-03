import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Plus, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

export const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [userRole, setUserRole] = useState('member'); // default

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [memberId, setMemberId] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const projData = await api.getProject(id);
        setProject(projData);

        const [tasksData, membersData] = await Promise.all([
          api.getTasks(id),
          api.getMembers(id)
        ]);
        
        setTasks(tasksData);
        setMembers(membersData);

        // Determine current user's role
        const me = membersData.find(m => m.user_id === user?.id);
        if (me) setUserRole(me.role);

      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, navigate, user?.id]);

  const canManage = userRole === 'admin' || userRole === 'manager';

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = { title: taskTitle, description: taskDesc, status: 'todo' };
      if (taskDueDate) {
        taskData.due_date = new Date(taskDueDate).toISOString();
      }
      await api.createTask(id, taskData);
      const newTasks = await api.getTasks(id);
      setTasks(newTasks);
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.addMember(id, parseInt(memberId), memberRole);
      const newMembers = await api.getMembers(id);
      setMembers(newMembers);
      setIsMemberModalOpen(false);
      setMemberId('');
      setMemberRole('member');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      try {
        await api.deleteProject(id);
        navigate('/');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(id, taskId, newStatus);
      const newTasks = await api.getTasks(id);
      setTasks(newTasks);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="app-container text-center mt-8">Loading...</div>;
  if (!project) return null;

  return (
    <div className="app-container">
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back to Dashboard
      </Button>

      <header className="flex-between mb-8">
        <div>
          <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
            <h1>{project.name}</h1>
            <span className="badge badge-blue">{userRole}</span>
          </div>
          <p className="text-muted">{project.description}</p>
        </div>
        
        {userRole === 'admin' && (
          <Button variant="danger" onClick={handleDeleteProject}>
            <Trash2 size={18} /> Delete Project
          </Button>
        )}
      </header>

      <div className="mb-8" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '2rem' }}>
          <button 
            className={`btn-ghost ${activeTab === 'tasks' ? 'text-primary' : 'text-muted'}`}
            style={{ padding: '1rem 0', borderBottom: activeTab === 'tasks' ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer', background: 'none', color: 'inherit', fontWeight: '500', fontSize: '1rem' }}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({tasks.length})
          </button>
          <button 
            className={`btn-ghost ${activeTab === 'members' ? 'text-primary' : 'text-muted'}`}
            style={{ padding: '1rem 0', borderBottom: activeTab === 'members' ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer', background: 'none', color: 'inherit', fontWeight: '500', fontSize: '1rem' }}
            onClick={() => setActiveTab('members')}
          >
            Members ({members.length})
          </button>
        </div>
      </div>

      {activeTab === 'tasks' && (
        <div>
          <div className="flex-between mb-4">
            <h3>Project Tasks</h3>
            <Button onClick={() => setIsTaskModalOpen(true)}>
              <Plus size={18} /> New Task
            </Button>
          </div>
          
          {tasks.length === 0 ? (
            <Card className="text-center">
              <p className="text-muted">No tasks yet.</p>
            </Card>
          ) : (
            <div className="grid-auto">
              {tasks.map(task => (
                <Card key={task.id}>
                  <div className="flex-between mb-2">
                    <h4 style={{ margin: 0 }}>{task.title}</h4>
                    {task.is_overdue && <span className="badge badge-danger">OVERDUE</span>}
                  </div>
                  <p className="text-muted mb-4 text-sm">
                    {task.description}
                    {task.due_date && (
                      <span style={{ display: 'block', marginTop: '0.5rem', color: task.is_overdue ? 'var(--color-danger)' : 'inherit' }}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                  <div className="flex-between">
                    <span className={`badge badge-${task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'yellow' : 'gray'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <select 
                      className="form-input" 
                      style={{ width: 'auto', minHeight: '32px', padding: '0.25rem' }}
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          <div className="flex-between mb-4">
            <h3>Team Members</h3>
            {canManage && (
              <Button onClick={() => setIsMemberModalOpen(true)}>
                <UserPlus size={18} /> Add Member
              </Button>
            )}
          </div>

          <div className="flex-col gap-4">
            {members.map(member => (
              <Card key={member.id} className="flex-between" style={{ padding: '1rem 1.5rem' }}>
                <div>
                  <h4 className="mb-1">{member.user?.name || `User ID: ${member.user_id}`}</h4>
                  <p className="text-muted text-sm">{member.user?.email || ''}</p>
                </div>
                <span className={`badge badge-${member.role === 'admin' ? 'danger' : member.role === 'manager' ? 'yellow' : 'gray'}`}>
                  {member.role}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="New Task">
        <form onSubmit={handleCreateTask}>
          <Input label="Task Title" id="taskTitle" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
          <Input label="Description" id="taskDesc" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
          <Input label="Due Date" id="taskDueDate" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
          <div className="flex-center gap-4 mt-8" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      {canManage && (
        <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="Add Team Member">
          <form onSubmit={handleAddMember}>
            <Input label="User ID" type="number" id="memberId" value={memberId} onChange={(e) => setMemberId(e.target.value)} required />
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                {userRole === 'admin' && <option value="admin">Admin</option>}
              </select>
            </div>
            <div className="flex-center gap-4 mt-8" style={{ justifyContent: 'flex-end' }}>
              <Button type="button" variant="ghost" onClick={() => setIsMemberModalOpen(false)}>Cancel</Button>
              <Button type="submit">Add Member</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
