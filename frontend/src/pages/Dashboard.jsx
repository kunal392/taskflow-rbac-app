import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

export const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, logout } = useAuth();
  
  // New Project Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    
    try {
      await api.createProject(name, description);
      await fetchProjects();
      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="app-container">
      <header className="flex-between mb-8">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.name}</p>
        </div>
        <div className="flex-center gap-4">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Project
          </Button>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="text-center mt-8 text-muted">Loading projects...</div>
      ) : projects.length === 0 ? (
        <Card className="text-center" style={{ padding: '4rem 2rem' }}>
          <Folder size={48} className="text-muted mb-4" style={{ margin: '0 auto' }} />
          <h3>No projects yet</h3>
          <p className="text-muted mb-4">Create your first project to get started</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid-auto">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card>
                <h3 className="mb-2">{project.name}</h3>
                <p className="text-muted mb-4">{project.description || 'No description provided'}</p>
                <div className="flex-between text-muted" style={{ fontSize: '0.875rem' }}>
                  <span>ID: {project.id}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject}>
          {error && <div className="form-error mb-4">{error}</div>}
          
          <Input
            label="Project Name"
            id="projectName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 Marketing Campaign"
            required
          />
          
          <Input
            label="Description"
            id="projectDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details about this project..."
          />
          
          <div className="flex-center gap-4 mt-8" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
